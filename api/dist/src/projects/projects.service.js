"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureTags(workspaceId, names) {
        if (!names?.length)
            return [];
        const upserts = names.map(name => this.prisma.tag.upsert({
            where: { workspaceId_name: { workspaceId, name } },
            update: {},
            create: { workspaceId, name },
            select: { id: true, name: true },
        }));
        return Promise.all(upserts);
    }
    async syncProjectTags(projectId, workspaceId, names = []) {
        const current = await this.prisma.projectTag.findMany({
            where: { projectId },
            select: { tagId: true, tag: { select: { name: true } } },
        });
        const currentNames = new Set(current.map(c => c.tag.name));
        const targetNames = Array.from(new Set(names.map(n => n.trim()).filter(Boolean)));
        const ensured = await this.ensureTags(workspaceId, targetNames);
        const targetIds = new Set(ensured.map(e => e.id));
        await this.prisma.projectTag.deleteMany({
            where: { projectId, tagId: { notIn: Array.from(targetIds) } },
        });
        const toCreate = ensured
            .filter(e => !current.find(c => c.tagId === e.id))
            .map(e => ({ projectId, tagId: e.id }));
        if (toCreate.length) {
            await this.prisma.projectTag.createMany({ data: toCreate, skipDuplicates: true });
        }
    }
    async checkWorkspaceQuota(workspaceId) {
        const ws = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { settings: true },
        });
        const maxProjects = ws?.settings?.maxProjects;
        if (!maxProjects)
            return;
        const count = await this.prisma.project.count({ where: { workspaceId, deletedAt: null } });
        if (count >= maxProjects)
            throw new common_1.ForbiddenException('Cuota de proyectos excedida en el workspace');
    }
    async audit(projectId, workspaceId, actorId, action, targetType, targetId, metadata) {
        await this.prisma.auditLog.create({
            data: { projectId, workspaceId, actorId, action: action, targetType, targetId, metadata },
        });
    }
    async listAccessible(userId, workspaceId) {
        if (workspaceId) {
            const wsMember = await this.prisma.workspaceMember.findUnique({
                where: { workspaceId_userId: { workspaceId, userId } },
                select: { role: true },
            });
            if (wsMember && (wsMember.role === 'OWNER' || wsMember.role === 'ADMIN')) {
                return this.prisma.project.findMany({
                    where: { workspaceId, deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                    include: { tags: { include: { tag: true } } },
                });
            }
            return this.prisma.project.findMany({
                where: {
                    workspaceId,
                    deletedAt: null,
                    members: { some: { userId } },
                },
                orderBy: { createdAt: 'desc' },
                include: { tags: { include: { tag: true } } },
            });
        }
        return this.prisma.project.findMany({
            where: { deletedAt: null, members: { some: { userId } } },
            orderBy: { createdAt: 'desc' },
            include: { tags: { include: { tag: true } } },
        });
    }
    async getByIdAuthorized(projectId, userId) {
        const p = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: { where: { userId }, select: { role: true } },
                tags: { include: { tag: true } },
            },
        });
        if (!p || p.deletedAt)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        if (p.members.length === 0)
            throw new common_1.ForbiddenException('Sin acceso a este proyecto');
        return p;
    }
    async create(workspaceId, userId, dto) {
        await this.checkWorkspaceQuota(workspaceId);
        try {
            const project = await this.prisma.project.create({
                data: {
                    workspaceId,
                    name: dto.name.trim(),
                    description: dto.description ?? null,
                    createdById: userId,
                    members: { create: { userId, role: 'OWNER' } },
                },
            });
            await this.syncProjectTags(project.id, workspaceId, dto.tags ?? []);
            await this.audit(project.id, workspaceId, userId, 'PROJECT_CREATE', 'Project', project.id, { name: project.name });
            return this.prisma.project.findUnique({
                where: { id: project.id },
                include: { tags: { include: { tag: true } } },
            });
        }
        catch (e) {
            if (e.code === 'P2002')
                throw new common_1.ConflictException('Ya existe un proyecto con ese nombre en el workspace');
            throw e;
        }
    }
    async updateMetadata(projectId, userId, dto) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.deletedAt)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        try {
            const updated = await this.prisma.project.update({
                where: { id: projectId },
                data: {
                    name: dto.name?.trim(),
                    description: dto.description ?? undefined,
                },
            });
            if (dto.tags) {
                await this.syncProjectTags(projectId, updated.workspaceId, dto.tags);
            }
            await this.audit(projectId, updated.workspaceId, userId, 'PROJECT_UPDATE', 'Project', projectId, dto);
            return this.prisma.project.findUnique({
                where: { id: projectId },
                include: { tags: { include: { tag: true } } },
            });
        }
        catch (e) {
            if (e.code === 'P2002')
                throw new common_1.ConflictException('Nombre duplicado en el workspace');
            throw e;
        }
    }
    async archive(projectId, userId) {
        const p = await this.prisma.project.update({
            where: { id: projectId },
            data: { status: 'ARCHIVED', archivedAt: new Date() },
        });
        await this.audit(projectId, p.workspaceId, userId, 'PROJECT_ARCHIVE', 'Project', projectId);
        return p;
    }
    async restore(projectId, userId) {
        const p = await this.prisma.project.update({
            where: { id: projectId },
            data: { status: 'ACTIVE', archivedAt: null },
        });
        await this.audit(projectId, p.workspaceId, userId, 'PROJECT_RESTORE', 'Project', projectId);
        return p;
    }
    async softDelete(projectId, userId) {
        const p = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!p || p.deletedAt)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        if (p.legalHold)
            throw new common_1.BadRequestException('El proyecto está bajo retención legal');
        const del = await this.prisma.project.update({
            where: { id: projectId },
            data: { deletedAt: new Date() },
        });
        await this.audit(projectId, del.workspaceId, userId, 'PROJECT_DELETE', 'Project', projectId);
        return del;
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map