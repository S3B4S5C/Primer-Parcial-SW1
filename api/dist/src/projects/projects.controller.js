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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("./projects.service");
const guards_1 = require("../auth/guards");
const workspace_role_1 = require("../common/decorators/workspace-role");
const workspace_role_guard_1 = require("../common/guards/workspace-role.guard");
const roles_1 = require("../common/decorators/roles");
const project_role_guard_1 = require("../common/guards/project-role.guard");
const create_project_dto_1 = require("./dto/create-project.dto");
const update_project_dto_1 = require("./dto/update-project.dto");
let ProjectsController = class ProjectsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(workspaceId, req) {
        const userId = req.user.userId;
        return this.svc.listAccessible(userId, workspaceId);
    }
    get(id, req) {
        const userId = req.user.userId;
        return this.svc.getByIdAuthorized(id, userId);
    }
    createInWorkspace(workspaceId, dto, req) {
        const userId = req.user.userId;
        return this.svc.create(workspaceId, userId, dto);
    }
    update(id, dto, req) {
        const userId = req.user.userId;
        return this.svc.updateMetadata(id, userId, dto);
    }
    archive(id, req) {
        return this.svc.archive(id, req.user.userId);
    }
    restore(id, req) {
        return this.svc.restore(id, req.user.userId);
    }
    remove(id, req) {
        return this.svc.softDelete(id, req.user.userId);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('workspaceId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "get", null);
__decorate([
    (0, common_1.UseGuards)(workspace_role_guard_1.WorkspaceRoleGuard),
    (0, workspace_role_1.RequireWorkspaceRole)('OWNER', 'ADMIN'),
    (0, common_1.Post)('/workspace/:workspaceId'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "createInWorkspace", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Patch)(':projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_project_dto_1.UpdateProjectDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Post)(':projectId/archive'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "archive", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Post)(':projectId/restore'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "restore", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Delete)(':projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "remove", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map