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
exports.WorkspaceRoleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const workspace_role_1 = require("../decorators/workspace-role");
let WorkspaceRoleGuard = class WorkspaceRoleGuard {
    prisma;
    reflector;
    constructor(prisma, reflector) {
        this.prisma = prisma;
        this.reflector = reflector;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const roles = this.reflector.get(workspace_role_1.WORKSPACE_ROLES_KEY, ctx.getHandler()) ?? [];
        if (roles.length === 0)
            return true;
        const userId = req.user?.userId;
        if (!userId)
            throw new common_1.ForbiddenException('No autenticado');
        const workspaceId = req.params.workspaceId || req.body.workspaceId;
        if (!workspaceId)
            throw new common_1.ForbiddenException('workspaceId requerido');
        const m = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: { role: true },
        });
        if (!m)
            throw new common_1.ForbiddenException('Sin acceso al workspace');
        const order = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
        const min = Math.max(...roles.map(r => order[r]));
        if (order[m.role] >= min)
            return true;
        throw new common_1.ForbiddenException('Rol insuficiente en workspace');
    }
};
exports.WorkspaceRoleGuard = WorkspaceRoleGuard;
exports.WorkspaceRoleGuard = WorkspaceRoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, core_1.Reflector])
], WorkspaceRoleGuard);
//# sourceMappingURL=workspace-role.guard.js.map