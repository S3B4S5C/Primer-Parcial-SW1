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
exports.ModelsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ModelsService = class ModelsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateDefaultBranch(projectId, userId) {
        let b = await this.prisma.branch.findFirst({
            where: { projectId, isDefault: true },
        });
        if (!b) {
            b = await this.prisma.branch.create({
                data: { projectId, name: 'main', isDefault: true, createdById: userId, description: 'Default branch' },
            });
        }
        return b;
    }
    async latestVersion(projectId, branchId) {
        return this.prisma.modelVersion.findFirst({
            where: { projectId, ...(branchId ? { branchId } : {}) },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getCurrent(projectId, userId, branchId) {
        const branch = branchId
            ? await this.prisma.branch.findFirst({ where: { id: branchId, projectId } })
            : await this.getOrCreateDefaultBranch(projectId, userId);
        if (!branch)
            throw new common_1.NotFoundException('Branch no encontrada');
        const ver = await this.latestVersion(projectId, branch.id);
        if (ver)
            return { branchId: branch.id, versionId: ver.id, content: ver.content };
        const created = await this.prisma.modelVersion.create({
            data: {
                projectId, branchId: branch.id, authorId: userId,
                message: 'init: empty model',
                content: { entities: [], relations: [], constraints: [] },
            },
        });
        return { branchId: branch.id, versionId: created.id, content: created.content };
    }
    validateDSL(dsl) {
        const names = new Set();
        for (const e of dsl.entities ?? []) {
            const n = e.name?.trim();
            if (!n)
                throw new common_1.BadRequestException('Clase sin nombre');
            if (names.has(n))
                throw new common_1.BadRequestException(`Nombre de clase duplicado: ${n}`);
            names.add(n);
            const attrNames = new Set();
            for (const a of e.attrs ?? []) {
                const an = a.name?.trim();
                if (!an)
                    throw new common_1.BadRequestException(`Atributo sin nombre en clase ${n}`);
                if (attrNames.has(an))
                    throw new common_1.BadRequestException(`Atributo duplicado ${an} en ${n}`);
                attrNames.add(an);
                if (!a.type)
                    throw new common_1.BadRequestException(`Atributo ${n}.${an} sin tipo`);
            }
        }
        for (const r of dsl.relations ?? []) {
            if (r.from === r.to)
                throw new common_1.BadRequestException('No se permiten relaciones de una clase consigo misma');
        }
        const existing = new Set(Array.from(names));
        for (const r of dsl.relations ?? []) {
            if (!existing.has(r.from))
                throw new common_1.BadRequestException(`Relación "from" no existente: ${r.from}`);
            if (!existing.has(r.to))
                throw new common_1.BadRequestException(`Relación "to" no existente: ${r.to}`);
        }
    }
    async saveNewVersion(projectId, userId, body) {
        const branch = body.branchId
            ? await this.prisma.branch.findFirst({ where: { id: body.branchId, projectId } })
            : await this.getOrCreateDefaultBranch(projectId, userId);
        if (!branch)
            throw new common_1.NotFoundException('Branch no encontrada');
        const prev = await this.latestVersion(projectId, branch.id);
        const content = body.content;
        this.validateDSL(content);
        const created = await this.prisma.modelVersion.create({
            data: {
                projectId, branchId: branch.id,
                parentVersionId: prev?.id ?? null,
                authorId: userId,
                message: body.message ?? 'edit',
                content: content,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                projectId, actorId: userId, action: 'MODEL_SNAPSHOT',
                targetType: 'ModelVersion', targetId: created.id,
                metadata: { message: created.message },
            },
        });
        return { versionId: created.id, createdAt: created.createdAt };
    }
};
exports.ModelsService = ModelsService;
exports.ModelsService = ModelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ModelsService);
//# sourceMappingURL=models.service.js.map