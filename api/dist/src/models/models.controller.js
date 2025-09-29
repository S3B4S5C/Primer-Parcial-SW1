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
exports.ModelsController = void 0;
const common_1 = require("@nestjs/common");
const guards_1 = require("../auth/guards");
const roles_1 = require("../common/decorators/roles");
const project_role_guard_1 = require("../common/guards/project-role.guard");
const models_service_1 = require("./models.service");
let ModelsController = class ModelsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async getCurrent(projectId, branchId, req) {
        const userId = req.user.userId;
        return this.svc.getCurrent(projectId, userId, branchId);
    }
    async saveNewVersion(projectId, dto, req) {
        const userId = req.user.userId;
        return this.svc.saveNewVersion(projectId, userId, dto);
    }
};
exports.ModelsController = ModelsController;
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('READER'),
    (0, common_1.Get)(':projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ModelsController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.UseGuards)(project_role_guard_1.ProjectRoleGuard),
    (0, roles_1.RequireProjectRole)('EDITOR'),
    (0, common_1.Post)(':projectId/versions'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ModelsController.prototype, "saveNewVersion", null);
exports.ModelsController = ModelsController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Controller)('models'),
    __metadata("design:paramtypes", [models_service_1.ModelsService])
], ModelsController);
//# sourceMappingURL=models.controller.js.map