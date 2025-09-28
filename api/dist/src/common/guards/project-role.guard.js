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
exports.ProjectRoleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const roles_1 = require("../decorators/roles");
let ProjectRoleGuard = class ProjectRoleGuard {
    prisma;
    reflector;
    constructor(prisma, reflector) {
        this.prisma = prisma;
        this.reflector = reflector;
    }
    async canActivate(ctx) {
        const roles = this.reflector.get(roles_1.PROJECT_ROLES_KEY, ctx.getHandler()) ?? [];
        if (roles.length === 0)
            return true;
        const req = ctx.switchToHttp().getRequest();
        const userId = req.user?.userId;
        if (!userId)
            throw new common_1.ForbiddenException('No autenticado');
        const projectId = req.params.projectId || req.query.projectId || req.body.projectId;
        if (!projectId)
            throw new common_1.ForbiddenException('projectId requerido');
        const membership = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
            select: { role: true },
        });
        if (!membership)
            throw new common_1.ForbiddenException('Sin acceso a este proyecto');
        const order = { OWNER: 3, EDITOR: 2, READER: 1 };
        const min = Math.max(...roles.map(r => order[r]));
        if (order[membership.role] >= min)
            return true;
        throw new common_1.ForbiddenException('Rol insuficiente');
    }
};
exports.ProjectRoleGuard = ProjectRoleGuard;
exports.ProjectRoleGuard = ProjectRoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, core_1.Reflector])
], ProjectRoleGuard);
//# sourceMappingURL=project-role.guard.js.map