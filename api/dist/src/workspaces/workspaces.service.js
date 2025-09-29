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
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkspacesService = class WorkspacesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listForUser(userId) {
        const rows = await this.prisma.workspace.findMany({
            where: { members: { some: { userId } } },
            select: {
                id: true, name: true, slug: true, description: true, createdAt: true,
                members: { where: { userId }, select: { role: true } },
                _count: { select: { projects: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description,
            role: r.members[0]?.role ?? 'MEMBER',
            projectCount: r._count.projects,
        }));
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkspacesService);
//# sourceMappingURL=workspaces.service.js.map