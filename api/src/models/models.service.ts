import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DSL = {
    entities: Array<{
        id?: string;
        name: string;
        stereotype?: string;
        attrs: Array<{ name: string; type: string; pk?: boolean; unique?: boolean; nullable?: boolean }>;
    }>;
    relations: Array<{
        from: string; to: string; kind: 'association' | 'aggregation' | 'composition';
        fromCard?: string; toCard?: string; fk?: string; onDelete?: 'cascade' | 'restrict' | 'setnull';
    }>;
    constraints?: any[];
};

@Injectable()
export class ModelsService {
    constructor(private prisma: PrismaService) { }

    private async getOrCreateDefaultBranch(projectId: string, userId: string) {
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

    private async latestVersion(projectId: string, branchId?: string) {
        return this.prisma.modelVersion.findFirst({
            where: { projectId, ...(branchId ? { branchId } : {}) },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getCurrent(projectId: string, userId: string, branchId?: string) {
        const branch = branchId
            ? await this.prisma.branch.findFirst({ where: { id: branchId, projectId } })
            : await this.getOrCreateDefaultBranch(projectId, userId);
        if (!branch) throw new NotFoundException('Branch no encontrada');

        const ver = await this.latestVersion(projectId, branch.id);
        if (ver) return { branchId: branch.id, versionId: ver.id, content: ver.content };

        // No hay versión: crea una vacía
        const created = await this.prisma.modelVersion.create({
            data: {
                projectId, branchId: branch.id, authorId: userId,
                message: 'init: empty model',
                content: { entities: [], relations: [], constraints: [] } as any,
            },
        });
        return { branchId: branch.id, versionId: created.id, content: created.content };
    }

    private validateDSL(dsl: DSL) {
        const names = new Set<string>();
        for (const e of dsl.entities ?? []) {
            const n = e.name?.trim();
            if (!n) throw new BadRequestException('Clase sin nombre');
            if (names.has(n)) throw new BadRequestException(`Nombre de clase duplicado: ${n}`);
            names.add(n);
            const attrNames = new Set<string>();
            for (const a of e.attrs ?? []) {
                const an = a.name?.trim();
                if (!an) throw new BadRequestException(`Atributo sin nombre en clase ${n}`);
                if (attrNames.has(an)) throw new BadRequestException(`Atributo duplicado ${an} en ${n}`);
                attrNames.add(an);
                if (!a.type) throw new BadRequestException(`Atributo ${n}.${an} sin tipo`);
            }
        }

        for (const r of dsl.relations ?? []) {
            if (r.from === r.to) throw new BadRequestException('No se permiten relaciones de una clase consigo misma');
        }
        // refs válidas
        const existing = new Set(Array.from(names));
        for (const r of dsl.relations ?? []) {
            if (!existing.has(r.from)) throw new BadRequestException(`Relación "from" no existente: ${r.from}`);
            if (!existing.has(r.to)) throw new BadRequestException(`Relación "to" no existente: ${r.to}`);
        }
    }

    async saveNewVersion(projectId: string, userId: string, body: { branchId?: string; message?: string; content: DSL }) {
        const branch = body.branchId
            ? await this.prisma.branch.findFirst({ where: { id: body.branchId, projectId } })
            : await this.getOrCreateDefaultBranch(projectId, userId);
        if (!branch) throw new NotFoundException('Branch no encontrada');

        const prev = await this.latestVersion(projectId, branch.id);
        const content = body.content as DSL;

        this.validateDSL(content);

        const created = await this.prisma.modelVersion.create({
            data: {
                projectId, branchId: branch.id,
                parentVersionId: prev?.id ?? null,
                authorId: userId,
                message: body.message ?? 'edit',
                content: content as any,
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
}
