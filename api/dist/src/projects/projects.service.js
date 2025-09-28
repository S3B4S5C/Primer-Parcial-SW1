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
    async create(dto, userId) {
        try {
            return await this.prisma.project.create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    workspace: { connect: { id: dto.workspaceId } },
                    createdBy: { connect: { id: userId } },
                },
            });
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.BadRequestException('Ya existe un proyecto con ese nombre en este espacio.');
            }
            throw e;
        }
    }
    findAllByWorkspace(workspaceId) {
        return this.prisma.project.findMany({
            where: { workspaceId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: { tags: { include: { tag: true } } },
        });
    }
    async findOne(id) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        return project;
    }
    async update(id, dto) {
        return this.prisma.project.update({ where: { id }, data: dto });
    }
    archive(id) {
        return this.prisma.project.update({
            where: { id },
            data: { status: 'ARCHIVED', archivedAt: new Date() },
        });
    }
    restore(id) {
        return this.prisma.project.update({
            where: { id },
            data: { status: 'ACTIVE', archivedAt: null },
        });
    }
    softDelete(id) {
        return this.prisma.project.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map