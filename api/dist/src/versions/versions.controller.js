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
exports.VersionsController = void 0;
const common_1 = require("@nestjs/common");
const guards_1 = require("../auth/guards");
const roles_1 = require("../common/decorators/roles");
const project_role_guard_1 = require("../common/guards/project-role.guard");
const versions_service_1 = require("./versions.service");
let VersionsController = class VersionsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    listBranches(projectId) {
        return this.svc.listBranches(projectId);
    }
    createBranch(projectId, body, req) {
        const userId = req.user.userId;
        return this.svc.createBranch(projectId, userId, body.name, body.fromVersionId);
    }
    listVersions(projectId, branchId, take = '50') {
        return this.svc.listVersions(projectId, branchId, Number(take) || 50);
    }
    diff(projectId, from, to) {
        return this.svc.diff(projectId, from, to);
    }
    restore(projectId, body, req) {
        const userId = req.user.userId;
        return this.svc.restore(projectId, userId, body.versionId, body.message);
    }
    merge(projectId, body, req) {
        const userId = req.user.userId;
        return this.svc.merge(projectId, userId, body);
    }
};
exports.VersionsController = VersionsController;
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('READER'),
    (0, common_1.Get)('branches'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "listBranches", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('EDITOR'),
    (0, common_1.Post)('branches'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "createBranch", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('READER'),
    (0, common_1.Get)('branches/:branchId/versions'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('branchId')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "listVersions", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('READER'),
    (0, common_1.Get)('diff'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "diff", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('EDITOR'),
    (0, common_1.Post)('restore'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "restore", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('EDITOR'),
    (0, common_1.Post)('merge'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "merge", null);
exports.VersionsController = VersionsController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Controller)('projects/:projectId'),
    __metadata("design:paramtypes", [versions_service_1.VersionsService])
], VersionsController);
//# sourceMappingURL=versions.controller.js.map