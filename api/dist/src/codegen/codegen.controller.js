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
exports.CodegenController = void 0;
const common_1 = require("@nestjs/common");
const guards_1 = require("../auth/guards");
const codegen_service_1 = require("./codegen.service");
const prisma_service_1 = require("../prisma/prisma.service");
let CodegenController = class CodegenController {
    svc;
    prisma;
    constructor(svc, prisma) {
        this.svc = svc;
        this.prisma = prisma;
    }
    async generate(projectId, body) {
        return this.svc.generateArtifacts(projectId, body);
    }
    async list(projectId) {
        const rows = await this.prisma.artifact.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, type: true, createdAt: true,
                storageBucket: true, storageKey: true,
                sizeBytes: true, checksumSha256: true,
                codegenConfigId: true, modelVersionId: true,
            },
        });
        return rows.map((r) => ({
            ...r,
            sizeBytes: r.sizeBytes == null ? null : r.sizeBytes.toString(),
        }));
    }
    async download(projectId, artifactId, res) {
        const a = await this.prisma.artifact.findFirst({ where: { id: artifactId, projectId } });
        if (!a)
            throw new common_1.NotFoundException('Artifact not found');
        if (a.storageBucket !== 'local')
            throw new common_1.NotFoundException('Unsupported storage');
        res.download(`storage/${a.storageKey}`);
    }
};
exports.CodegenController = CodegenController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, codegen_service_1.GenerateDto]),
    __metadata("design:returntype", Promise)
], CodegenController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CodegenController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':artifactId/download'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('artifactId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CodegenController.prototype, "download", null);
exports.CodegenController = CodegenController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Controller)('projects/:projectId/artifacts'),
    __metadata("design:paramtypes", [codegen_service_1.CodegenService, prisma_service_1.PrismaService])
], CodegenController);
//# sourceMappingURL=codegen.controller.js.map