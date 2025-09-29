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
exports.CollaboratorsController = void 0;
const common_1 = require("@nestjs/common");
const guards_1 = require("../auth/guards");
const roles_1 = require("../common/decorators/roles");
const project_role_guard_1 = require("../common/guards/project-role.guard");
const collaborators_service_1 = require("./collaborators.service");
const add_member_dto_1 = require("./dto/add-member.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
let CollaboratorsController = class CollaboratorsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(projectId) {
        return this.svc.list(projectId);
    }
    add(projectId, dto, req) {
        const actorId = req.user.userId;
        return this.svc.add(projectId, actorId, dto);
    }
    updateRole(projectId, memberId, dto, req) {
        const actorId = req.user.userId;
        return this.svc.updateRole(projectId, memberId, dto.role, actorId);
    }
    remove(projectId, memberId, req) {
        const actorId = req.user.userId;
        return this.svc.remove(projectId, memberId, actorId);
    }
    search(projectId, q = '') {
        return this.svc.searchUsersInWorkspace(projectId, q);
    }
    audit(projectId) {
        return this.svc.audit(projectId);
    }
};
exports.CollaboratorsController = CollaboratorsController;
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('READER'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CollaboratorsController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_member_dto_1.AddMemberDto, Object]),
    __metadata("design:returntype", void 0)
], CollaboratorsController.prototype, "add", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Patch)(':memberId/role'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_role_dto_1.UpdateRoleDto, Object]),
    __metadata("design:returntype", void 0)
], CollaboratorsController.prototype, "updateRole", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Delete)(':memberId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CollaboratorsController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Get)('/search'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaboratorsController.prototype, "search", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('OWNER'),
    (0, common_1.Get)('/audit'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CollaboratorsController.prototype, "audit", null);
exports.CollaboratorsController = CollaboratorsController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Controller)('projects/:projectId/collaborators'),
    __metadata("design:paramtypes", [collaborators_service_1.CollaboratorsService])
], CollaboratorsController);
//# sourceMappingURL=collaborators.controller.js.map