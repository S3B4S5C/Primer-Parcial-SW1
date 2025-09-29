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
exports.VersionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VersionsService = class VersionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listBranches(projectId) {
        const branches = await this.prisma.branch.findMany({
            where: { projectId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            select: {
                id: true, name: true, isDefault: true, createdAt: true,
                versions: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, createdAt: true, message: true } },
            },
        });
        return branches.map(b => ({ ...b, latestVersion: b.versions[0] ?? null, versions: undefined }));
    }
    async createBranch(projectId, userId, name, fromVersionId) {
        if (!name?.trim())
            throw new common_1.BadRequestException('Nombre de rama requerido');
        const created = await this.prisma.branch.create({
            data: { projectId, name: name.trim(), isDefault: false, createdById: userId },
        });
        if (fromVersionId) {
            const base = await this.prisma.modelVersion.findFirst({ where: { id: fromVersionId, projectId } });
            if (!base)
                throw new common_1.NotFoundException('Versión base no encontrada');
            await this.prisma.modelVersion.create({
                data: {
                    projectId, branchId: created.id, authorId: userId,
                    parentVersionId: base.id, message: `branch: ${name} from ${base.id.slice(0, 7)}`,
                    content: base.content,
                },
            });
        }
        await this.prisma.auditLog.create({
            data: { projectId, actorId: userId, action: 'BRANCH_CREATE', targetType: 'Branch', targetId: created.id, metadata: { name } },
        });
        return created;
    }
    async listVersions(projectId, branchId, take = 50) {
        return this.prisma.modelVersion.findMany({
            where: { projectId, branchId },
            orderBy: { createdAt: 'desc' },
            take,
            select: { id: true, createdAt: true, message: true, author: { select: { id: true, email: true, name: true } } },
        });
    }
    indexByName(arr) {
        const m = new Map();
        for (const it of arr)
            m.set(it.name, it);
        return m;
    }
    sameAttr(a, b) {
        return a.name === b.name && a.type === b.type && !!a.pk === !!b.pk && !!a.unique === !!b.unique && !!a.nullable === !!b.nullable;
    }
    diffEntities(a, b) {
        const A = this.indexByName(a), B = this.indexByName(b);
        const added = [], removed = [], changed = [];
        for (const [name, eA] of A) {
            if (!B.has(name))
                removed.push(eA);
            else {
                const eB = B.get(name);
                const attrsA = this.indexByName(eA.attrs ?? []), attrsB = this.indexByName(eB.attrs ?? []);
                const attrAdded = [], attrRemoved = [], attrChanged = [];
                for (const [an, atA] of attrsA) {
                    if (!attrsB.has(an))
                        attrRemoved.push(atA);
                    else {
                        const atB = attrsB.get(an);
                        if (!this.sameAttr(atA, atB))
                            attrChanged.push({ name: an, from: atA, to: atB });
                    }
                }
                for (const [an, atB] of attrsB)
                    if (!attrsA.has(an))
                        attrAdded.push(atB);
                if (eA.stereotype !== eB.stereotype || attrAdded.length || attrRemoved.length || attrChanged.length) {
                    changed.push({ name, stereotype: { from: eA.stereotype, to: eB.stereotype }, attrAdded, attrRemoved, attrChanged });
                }
            }
        }
        for (const [name, eB] of B)
            if (!A.has(name))
                added.push(eB);
        return { added, removed, changed };
    }
    keyRel(r) { return `${r.from}::${r.to}`; }
    diffRelations(a, b) {
        const A = new Map(a.map(r => [this.keyRel(r), r]));
        const B = new Map(b.map(r => [this.keyRel(r), r]));
        const added = [], removed = [], changed = [];
        for (const [k, rA] of A) {
            if (!B.has(k))
                removed.push(rA);
            else {
                const rB = B.get(k);
                if (rA.kind !== rB.kind || (rA.fromCard ?? '') !== (rB.fromCard ?? '') || (rA.toCard ?? '') !== (rB.toCard ?? '')) {
                    changed.push({ key: k, from: rA, to: rB });
                }
            }
        }
        for (const [k, rB] of B)
            if (!A.has(k))
                added.push(rB);
        return { added, removed, changed };
    }
    async getVersion(projectId, versionId) {
        const v = await this.prisma.modelVersion.findFirst({ where: { id: versionId, projectId } });
        if (!v)
            throw new common_1.NotFoundException('Versión no encontrada');
        return v;
    }
    async diff(projectId, fromVersionId, toVersionId) {
        if (fromVersionId === toVersionId)
            throw new common_1.BadRequestException('Seleccione dos versiones distintas');
        const [A, B] = await Promise.all([
            this.getVersion(projectId, fromVersionId),
            this.getVersion(projectId, toVersionId),
        ]);
        const a = A.content, b = B.content;
        const entities = this.diffEntities(a.entities ?? [], b.entities ?? []);
        const relations = this.diffRelations(a.relations ?? [], b.relations ?? []);
        const summary = {
            entities: { added: entities.added.length, removed: entities.removed.length, changed: entities.changed.length },
            relations: { added: relations.added.length, removed: relations.removed.length, changed: relations.changed.length },
        };
        await this.prisma.modelDiff.upsert({
            where: { fromVersionId_toVersionId: { fromVersionId, toVersionId } },
            create: { id: undefined, projectId, fromVersionId, toVersionId, diff: { entities, relations, summary } },
            update: { diff: { entities, relations, summary } },
        });
        return { summary, entities, relations };
    }
    async restore(projectId, userId, versionId, message) {
        const v = await this.getVersion(projectId, versionId);
        const latest = await this.prisma.modelVersion.findFirst({
            where: { projectId, branchId: v.branchId }, orderBy: { createdAt: 'desc' }
        });
        const created = await this.prisma.modelVersion.create({
            data: {
                projectId, branchId: v.branchId, authorId: userId,
                parentVersionId: latest?.id ?? null,
                message: message ?? `restore: ${v.id.slice(0, 7)}`,
                content: v.content,
            },
        });
        await this.prisma.auditLog.create({
            data: { projectId, actorId: userId, action: 'MODEL_SNAPSHOT', targetType: 'ModelVersion', targetId: created.id, metadata: { restoreFrom: v.id } },
        });
        return created;
    }
    async traceParents(projectId, startId, limit = 200) {
        const visited = new Set();
        let cur = await this.getVersion(projectId, startId);
        while (cur && limit-- > 0) {
            visited.add(cur.id);
            if (!cur.parentVersionId)
                break;
            cur = await this.getVersion(projectId, cur.parentVersionId);
        }
        return visited;
    }
    async findCommonAncestor(projectId, aId, bId) {
        const aAnc = await this.traceParents(projectId, aId);
        let cur = await this.getVersion(projectId, bId);
        let limit = 200;
        while (cur && limit-- > 0) {
            if (aAnc.has(cur.id))
                return cur;
            if (!cur.parentVersionId)
                break;
            cur = await this.getVersion(projectId, cur.parentVersionId);
        }
        return null;
    }
    indexEntities(d) {
        const map = new Map();
        for (const e of d.entities ?? [])
            map.set(e.name, e);
        return map;
    }
    indexRelations(d) {
        const map = new Map();
        for (const r of d.relations ?? [])
            map.set(this.keyRel(r), r);
        return map;
    }
    threeWayMerge(base, ours, theirs) {
        const conflicts = [];
        const resEntities = new Map();
        const bE = this.indexEntities(base), oE = this.indexEntities(ours), tE = this.indexEntities(theirs);
        const allNames = new Set([...bE.keys(), ...oE.keys(), ...tE.keys()]);
        for (const name of allNames) {
            const b = bE.get(name), o = oE.get(name), t = tE.get(name);
            if (!b && o && !t) {
                resEntities.set(name, o);
                continue;
            }
            if (!b && !o && t) {
                resEntities.set(name, t);
                continue;
            }
            if (b && !o && !t) {
                continue;
            }
            if (b && o && !t) {
                resEntities.set(name, o);
                continue;
            }
            if (b && !o && t) {
                resEntities.set(name, t);
                continue;
            }
            if (!o || !t)
                continue;
            const pick = (x) => (x ?? '');
            if (pick(o.stereotype) !== pick(t.stereotype) && pick(o.stereotype) !== pick(b?.stereotype) && pick(t.stereotype) !== pick(b?.stereotype)) {
                conflicts.push({ type: 'entity.stereotype', name, ours: o.stereotype, theirs: t.stereotype });
            }
            const mAttrs = new Map();
            const names = new Set([...(o.attrs ?? []).map(a => a.name), ...(t.attrs ?? []).map(a => a.name), ...(b?.attrs ?? []).map(a => a.name)]);
            for (const an of names) {
                const bo = (b?.attrs ?? []).find(a => a.name === an);
                const ao = (o.attrs ?? []).find(a => a.name === an);
                const at = (t.attrs ?? []).find(a => a.name === an);
                if (!bo && ao && !at) {
                    mAttrs.set(an, ao);
                    continue;
                }
                if (!bo && !ao && at) {
                    mAttrs.set(an, at);
                    continue;
                }
                if (bo && !ao && !at) {
                    continue;
                }
                if (bo && ao && !at) {
                    mAttrs.set(an, ao);
                    continue;
                }
                if (bo && !ao && at) {
                    mAttrs.set(an, at);
                    continue;
                }
                if (ao && at) {
                    const same = (x, y) => x.type === y.type && !!x.pk === !!y.pk && !!x.unique === !!y.unique && !!x.nullable === !!y.nullable;
                    if (!same(ao, at) && (!bo || (!same(ao, bo) && !same(at, bo)))) {
                        conflicts.push({ type: 'attr', entity: name, attr: an, ours: ao, theirs: at });
                        mAttrs.set(an, ao);
                    }
                    else {
                        mAttrs.set(an, ao);
                    }
                }
            }
            resEntities.set(name, { name, stereotype: o.stereotype ?? t.stereotype ?? b?.stereotype, attrs: Array.from(mAttrs.values()) });
        }
        const resRelations = new Map();
        const bR = this.indexRelations(base), oR = this.indexRelations(ours), tR = this.indexRelations(theirs);
        const allR = new Set([...bR.keys(), ...oR.keys(), ...tR.keys()]);
        for (const k of allR) {
            const b = bR.get(k), o = oR.get(k), t = tR.get(k);
            if (!b && o && !t) {
                resRelations.set(k, o);
                continue;
            }
            if (!b && !o && t) {
                resRelations.set(k, t);
                continue;
            }
            if (b && !o && !t) {
                continue;
            }
            if (b && o && !t) {
                resRelations.set(k, o);
                continue;
            }
            if (b && !o && t) {
                resRelations.set(k, t);
                continue;
            }
            if (!o || !t)
                continue;
            const eq = (x, y) => x.kind === y.kind && (x.fromCard ?? '') === (y.fromCard ?? '') && (x.toCard ?? '') === (y.toCard ?? '');
            if (!eq(o, t) && (!b || (!eq(o, b) && !eq(t, b)))) {
                conflicts.push({ type: 'relation', key: k, ours: o, theirs: t });
                resRelations.set(k, o);
            }
            else {
                resRelations.set(k, o);
            }
        }
        const result = { entities: Array.from(resEntities.values()), relations: Array.from(resRelations.values()), constraints: base.constraints ?? [] };
        return { result, conflicts };
    }
    async merge(projectId, userId, params) {
        const { sourceBranchId, targetBranchId, sourceVersionId, targetVersionId } = params;
        const [src, dst] = await Promise.all([
            this.getVersion(projectId, sourceVersionId),
            this.getVersion(projectId, targetVersionId),
        ]);
        if (src.branchId !== sourceBranchId || dst.branchId !== targetBranchId) {
            throw new common_1.BadRequestException('Las versiones no corresponden a las ramas indicadas');
        }
        const ancestor = await this.findCommonAncestor(projectId, sourceVersionId, targetVersionId);
        const base = ancestor?.content ?? { entities: [], relations: [], constraints: [] };
        const ours = dst.content;
        const theirs = src.content;
        const { result, conflicts } = this.threeWayMerge(base, ours, theirs);
        const mergeRec = await this.prisma.merge.create({
            data: {
                projectId,
                sourceBranchId, targetBranchId,
                sourceVersionId, targetVersionId,
                status: conflicts.length ? 'CONFLICTS' : 'COMPLETED',
                conflicts: conflicts.length ? conflicts : null,
                createdById: userId,
            },
        });
        const created = await this.prisma.modelVersion.create({
            data: {
                projectId, branchId: targetBranchId, authorId: userId,
                parentVersionId: targetVersionId,
                message: conflicts.length ? 'merge (with conflicts)' : 'merge',
                content: result,
            },
        });
        await this.prisma.merge.update({
            where: { id: mergeRec.id },
            data: { resultVersionId: created.id },
        });
        await this.prisma.auditLog.create({
            data: { projectId, actorId: userId, action: 'MERGE', targetType: 'Merge', targetId: mergeRec.id,
                metadata: { conflicts: conflicts.length, resultVersionId: created.id } },
        });
        return { mergeId: mergeRec.id, status: conflicts.length ? 'CONFLICTS' : 'COMPLETED', conflicts, resultVersionId: created.id };
    }
};
exports.VersionsService = VersionsService;
exports.VersionsService = VersionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VersionsService);
//# sourceMappingURL=versions.service.js.map