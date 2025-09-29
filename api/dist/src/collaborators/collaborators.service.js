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
exports.CollaboratorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CollaboratorsService = class CollaboratorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(projectId) {
        const rows = await this.prisma.projectMember.findMany({
            where: { projectId },
            orderBy: { addedAt: 'asc' },
            select: {
                id: true, role: true, addedAt: true,
                user: { select: { id: true, email: true, name: true, status: true, avatarUrl: true } },
            },
        });
        return rows;
    }
    async ensureNotLastOwner(projectId, memberIdOrUserId) {
        const owners = await this.prisma.projectMember.findMany({
            where: { projectId, role: 'OWNER' },
            select: { id: true, userId: true },
        });
        if (owners.length <= 1) {
            const only = owners[0];
            if (only && (only.id === memberIdOrUserId.memberId || only.userId === memberIdOrUserId.userId)) {
                throw new common_1.BadRequestException('Debe existir al menos un propietario en el proyecto');
            }
        }
    }
    async add(projectId, actorId, dto) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.deletedAt)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        let userId = dto.userId;
        if (!userId && dto.email) {
            const email = dto.email.toLowerCase();
            let u = await this.prisma.user.findUnique({ where: { email } });
            if (!u) {
                u = await this.prisma.user.create({ data: { email, status: 'INVITED' } });
            }
            userId = u.id;
        }
        if (!userId)
            throw new common_1.BadRequestException('Debe enviar userId o email');
        const dup = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
        });
        if (dup)
            throw new common_1.ConflictException('El usuario ya es colaborador del proyecto');
        const wsMember = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
        });
        if (!wsMember) {
            await this.prisma.workspaceMember.create({
                data: { workspaceId: project.workspaceId, userId, role: 'MEMBER' },
            });
        }
        const mem = await this.prisma.projectMember.create({
            data: { projectId, userId, role: dto.role },
        });
        await this.prisma.auditLog.create({
            data: { projectId, actorId, action: 'MEMBER_ADD', targetType: 'ProjectMember', targetId: mem.id, metadata: { role: dto.role, userId } },
        });
        return this.list(projectId);
    }
    async updateRole(projectId, memberId, newRole, actorId) {
        const m = await this.prisma.projectMember.findUnique({ where: { id: memberId } });
        if (!m || m.projectId !== projectId)
            throw new common_1.NotFoundException('Miembro no encontrado');
        if (m.role === 'OWNER' && newRole !== 'OWNER') {
            await this.ensureNotLastOwner(projectId, { memberId });
        }
        const updated = await this.prisma.projectMember.update({
            where: { id: memberId },
            data: { role: newRole },
        });
        await this.prisma.auditLog.create({
            data: { projectId, actorId, action: 'MEMBER_UPDATE', targetType: 'ProjectMember', targetId: memberId, metadata: { from: m.role, to: newRole } },
        });
        return updated;
    }
    async remove(projectId, memberId, actorId) {
        const m = await this.prisma.projectMember.findUnique({ where: { id: memberId } });
        if (!m || m.projectId !== projectId)
            throw new common_1.NotFoundException('Miembro no encontrado');
        if (m.role === 'OWNER') {
            await this.ensureNotLastOwner(projectId, { memberId });
        }
        await this.prisma.projectMember.delete({ where: { id: memberId } });
        await this.prisma.auditLog.create({
            data: { projectId, actorId, action: 'MEMBER_REMOVE', targetType: 'ProjectMember', targetId: memberId },
        });
        return { ok: true };
    }
    async audit(projectId) {
        return this.prisma.auditLog.findMany({
            where: { projectId, action: { in: ['MEMBER_ADD', 'MEMBER_UPDATE', 'MEMBER_REMOVE'] } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async searchUsersInWorkspace(projectId, q) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        const wsm = await this.prisma.workspaceMember.findMany({
            where: { workspaceId: project.workspaceId, user: { OR: [
                        { email: { contains: q, mode: 'insensitive' } },
                        { name: { contains: q, mode: 'insensitive' } },
                    ] } },
            select: { user: { select: { id: true, email: true, name: true, status: true } } },
            take: 20,
        });
        const existingIds = new Set((await this.prisma.projectMember.findMany({ where: { projectId }, select: { userId: true } })).map(x => x.userId));
        return wsm.map(x => x.user).filter(u => !existingIds.has(u.id));
    }
};
exports.CollaboratorsService = CollaboratorsService;
exports.CollaboratorsService = CollaboratorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollaboratorsService);
//# sourceMappingURL=collaborators.service.js.map