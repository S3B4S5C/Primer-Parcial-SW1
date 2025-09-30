"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodegenService = exports.GenerateDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const archiver = __importStar(require("archiver"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const node_crypto_1 = require("node:crypto");
class GenerateDto {
    types;
    packageBase;
    dbEngine;
    migrationTool;
    branchId;
    modelVersionId;
}
exports.GenerateDto = GenerateDto;
let CodegenService = class CodegenService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
    sha256(filePath) {
        const h = (0, node_crypto_1.createHash)('sha256');
        h.update(fs.readFileSync(filePath));
        return h.digest('hex');
    }
    mapTypeToJava(t) {
        const k = t.toLowerCase();
        if (k.includes('uuid'))
            return 'java.util.UUID';
        if (k.includes('int'))
            return 'java.lang.Integer';
        if (k.includes('bigint') || k === 'long')
            return 'java.lang.Long';
        if (k.includes('bool'))
            return 'java.lang.Boolean';
        if (k.includes('date'))
            return 'java.time.LocalDate';
        if (k.includes('time'))
            return 'java.time.Instant';
        return 'java.lang.String';
    }
    mapTypeToSql(t, db) {
        const k = t.toLowerCase();
        if (k.includes('uuid'))
            return db === 'POSTGRESQL' ? 'uuid' : 'char(36)';
        if (k.includes('int'))
            return 'integer';
        if (k.includes('bigint') || k === 'long')
            return 'bigint';
        if (k.includes('bool'))
            return 'boolean';
        if (k.includes('date'))
            return 'date';
        if (k.includes('time'))
            return 'timestamp';
        return 'varchar(255)';
    }
    sanitizeId(s) {
        return s.replace(/[^\w]/g, '');
    }
    async loadIR(projectId, branchId, modelVersionId) {
        let bid = branchId;
        if (!bid) {
            const def = await this.prisma.branch.findFirst({ where: { projectId, isDefault: true } });
            if (!def)
                throw new common_1.BadRequestException('No default branch');
            bid = def.id;
        }
        const mv = modelVersionId
            ? await this.prisma.modelVersion.findUnique({ where: { id: modelVersionId } })
            : await this.prisma.modelVersion.findFirst({
                where: { projectId, branchId: bid },
                orderBy: { createdAt: 'desc' },
            });
        if (!mv)
            throw new common_1.BadRequestException('No model version to generate from');
        const raw = mv.content;
        const model = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(model?.entities)) {
            const entities = model.entities.map((e) => {
                const className = this.sanitizeId((e.name ?? 'Entity').toString().trim().replace(/\s+/g, ''));
                const route = className.charAt(0).toLowerCase() + className.slice(1);
                const table = className.toLowerCase();
                const fields = (Array.isArray(e.attrs) ? e.attrs : []).map((a) => ({
                    name: this.sanitizeId(a.name || 'field'),
                    pk: !!a.pk,
                    nullable: !!a.nullable,
                    unique: !!a.unique,
                    javaType: this.mapTypeToJava(a.type || 'string'),
                    sqlType: this.mapTypeToSql(a.type || 'string', 'POSTGRESQL'),
                }));
                let idField = fields.find(f => f.pk) ?? fields.find(f => f.name === 'id');
                if (!idField) {
                    idField = {
                        name: 'id', pk: true, nullable: false, unique: true,
                        javaType: 'java.util.UUID', sqlType: this.mapTypeToSql('uuid', 'POSTGRESQL'),
                    };
                    fields.unshift(idField);
                }
                return { name: className, table, fields, idField, route };
            });
            const rels = (Array.isArray(model.relations) ? model.relations : []).map((r) => ({
                from: this.sanitizeId((r.from || '').toString().replace(/\s+/g, '')),
                to: this.sanitizeId((r.to || '').toString().replace(/\s+/g, '')),
                kind: r.kind || 'association',
                fromCard: r.fromCard || 'N',
                toCard: r.toCard || '1',
            }));
            return { entities, rels, modelVersionId: mv.id };
        }
        const candidates = [
            model,
            model?.model,
            model?.diagram,
            model?.patch,
            model?.content,
        ].filter(Boolean);
        const payload = candidates.find((c) => Array.isArray(c?.nodeDataArray) && Array.isArray(c?.linkDataArray)) ??
            candidates.find((c) => Array.isArray(c?.nodeDataArray)) ??
            {};
        const nodes = Array.isArray(payload.nodeDataArray) ? payload.nodeDataArray : [];
        const links = Array.isArray(payload.linkDataArray) ? payload.linkDataArray : [];
        if (!nodes.length) {
            throw new common_1.BadRequestException('El modelo está vacío. Guarda el diagrama y vuelve a generar.');
        }
        const entities = nodes.map((n) => {
            const name = (n.name ?? n.key ?? 'Entity').toString().trim();
            const className = this.sanitizeId(name.replace(/\s+/g, ''));
            const route = className.charAt(0).toLowerCase() + className.slice(1);
            const table = className.toLowerCase();
            const attrs = Array.isArray(n.attrs) ? n.attrs : [];
            const fields = attrs.map((a) => ({
                name: this.sanitizeId(a.name || 'field'),
                pk: !!a.pk,
                nullable: !!a.nullable,
                unique: !!a.unique,
                javaType: this.mapTypeToJava(a.type || 'string'),
                sqlType: this.mapTypeToSql(a.type || 'string', 'POSTGRESQL'),
            }));
            let idField = fields.find(f => f.pk) ?? fields.find(f => f.name === 'id');
            if (!idField) {
                idField = {
                    name: 'id', pk: true, nullable: false, unique: true,
                    javaType: 'java.util.UUID', sqlType: this.mapTypeToSql('uuid', 'POSTGRESQL'),
                };
                fields.unshift(idField);
            }
            return { name: className, table, fields, idField, route };
        });
        const rels = links.map((l) => ({
            from: this.sanitizeId((l.from || '').toString().replace(/\s+/g, '')),
            to: this.sanitizeId((l.to || '').toString().replace(/\s+/g, '')),
            kind: l.kind || 'association',
            fromCard: l.fromCard || 'N',
            toCard: l.toCard || '1',
        }));
        return { entities, rels, modelVersionId: mv.id };
    }
    async generateArtifacts(projectId, dto) {
        const types = dto.types?.length ? dto.types : ['SPRING_BOOT_PROJECT', 'POSTMAN_COLLECTION'];
        const pkg = dto.packageBase || 'com.acme.demo';
        const db = dto.dbEngine || 'POSTGRESQL';
        const mig = dto.migrationTool || 'FLYWAY';
        const { entities, rels, modelVersionId } = await this.loadIR(projectId, dto.branchId, dto.modelVersionId);
        const outDir = path.join(process.cwd(), 'storage', 'work', `${projectId}-${Date.now()}`);
        this.ensureDir(outDir);
        const artifacts = [];
        if (types.includes('SPRING_BOOT_PROJECT')) {
            const zipPath = path.join(outDir, `springboot-${projectId}.zip`);
            await this.buildSpringBootZip(zipPath, { pkg, db, mig, entities, rels });
            artifacts.push({ type: 'SPRING_BOOT_PROJECT', file: zipPath, storageKey: `work/${path.basename(outDir)}/${path.basename(zipPath)}` });
        }
        if (types.includes('SQL_DDL') || types.includes('MIGRATIONS_FLYWAY')) {
            const ddl = this.renderDDL({ db, entities, rels });
            const ddlPath = path.join(outDir, `schema-${projectId}.sql`);
            fs.writeFileSync(ddlPath, ddl, 'utf-8');
            artifacts.push({ type: 'SQL_DDL', file: ddlPath, storageKey: `work/${path.basename(outDir)}/${path.basename(ddlPath)}` });
            if (types.includes('MIGRATIONS_FLYWAY')) {
                const v1 = path.join(outDir, `V1__init.sql`);
                fs.writeFileSync(v1, ddl, 'utf-8');
                artifacts.push({ type: 'MIGRATIONS_FLYWAY', file: v1, storageKey: `work/${path.basename(outDir)}/${path.basename(v1)}` });
            }
        }
        if (types.includes('POSTMAN_COLLECTION')) {
            const pm = this.renderPostman({ pkg, entities });
            const pmPath = path.join(outDir, `postman-${projectId}.json`);
            fs.writeFileSync(pmPath, JSON.stringify(pm, null, 2), 'utf-8');
            artifacts.push({ type: 'POSTMAN_COLLECTION', file: pmPath, storageKey: `work/${path.basename(outDir)}/${path.basename(pmPath)}` });
        }
        if (types.includes('OPENAPI_SPEC')) {
            const oaPath = path.join(outDir, `openapi-note.txt`);
            fs.writeFileSync(oaPath, `El proyecto Spring Boot generado incluye springdoc-openapi. Levanta la app y visita /v3/api-docs`, 'utf-8');
            artifacts.push({ type: 'OPENAPI_SPEC', file: oaPath, storageKey: `work/${path.basename(outDir)}/${path.basename(oaPath)}` });
        }
        const saved = [];
        for (const a of artifacts) {
            const dest = path.join(process.cwd(), 'storage', a.storageKey);
            this.ensureDir(path.dirname(dest));
            fs.copyFileSync(a.file, dest);
            const size = fs.statSync(dest).size;
            const sum = this.sha256(dest);
            const rec = await this.prisma.artifact.create({
                data: {
                    projectId,
                    modelVersionId,
                    type: a.type,
                    visibility: 'PRIVATE',
                    storageBucket: 'local',
                    storageKey: a.storageKey,
                    sizeBytes: BigInt(size),
                    checksumSha256: sum,
                    metadata: { packageBase: pkg, dbEngine: db, migrationTool: mig },
                },
                select: { id: true, type: true, storageKey: true, createdAt: true },
            });
            saved.push(rec);
        }
        return { ok: true, artifacts: saved };
    }
    async buildSpringBootZip(zipPath, ctx) {
        const fs = await import('node:fs');
        const path = await import('node:path');
        fs.mkdirSync(path.dirname(zipPath), { recursive: true });
        const output = fs.createWriteStream(zipPath);
        const archive = archiver.create('zip', { zlib: { level: 9 } });
        const done = new Promise((resolve, reject) => {
            output.on('close', () => resolve());
            archive.on('error', err => reject(err));
        });
        archive.pipe(output);
        const groupPath = ctx.pkg.replace(/\./g, '/');
        archive.append(this.tpl('springboot/pom.hbs', ctx), { name: 'pom.xml' });
        archive.append(this.tpl('springboot/gitignore.hbs', ctx), { name: '.gitignore' });
        archive.append(this.tpl('springboot/Application.hbs', ctx), { name: `src/main/java/${groupPath}/Application.java` });
        archive.append(this.tpl('springboot/application.properties.hbs', ctx), { name: `src/main/resources/application.properties` });
        for (const e of ctx.entities) {
            archive.append(this.tpl('springboot/Entity.hbs', { ...ctx, e }), { name: `src/main/java/${groupPath}/domain/${e.name}.java` });
            archive.append(this.tpl('springboot/Repository.hbs', { ...ctx, e }), { name: `src/main/java/${groupPath}/repository/${e.name}Repository.java` });
            archive.append(this.tpl('springboot/Service.hbs', { ...ctx, e }), { name: `src/main/java/${groupPath}/service/${e.name}Service.java` });
            archive.append(this.tpl('springboot/Controller.hbs', { ...ctx, e }), { name: `src/main/java/${groupPath}/web/${e.name}Controller.java` });
        }
        archive.append('', { name: `src/main/resources/db/migration/.keep` });
        await archive.finalize();
        await done;
    }
    renderDDL(ctx) {
        const lines = [];
        for (const e of ctx.entities) {
            lines.push(`CREATE TABLE IF NOT EXISTS "${e.table}" (`);
            const cols = e.fields.map((f) => {
                const notnull = f.nullable ? '' : ' NOT NULL';
                const unique = f.unique ? ' UNIQUE' : '';
                return `  "${f.name}" ${f.sqlType}${notnull}${unique}`;
            });
            cols.push(`  PRIMARY KEY ("${e.idField.name}")`);
            lines.push(cols.join(',\n'));
            lines.push(');');
            lines.push('');
        }
        return lines.join('\n');
    }
    renderPostman({ entities }) {
        const variable = [{ key: 'baseUrl', value: 'http://localhost:8080', type: 'string' }];
        const item = entities.map((e) => {
            const base = `{{baseUrl}}/api/${e.route}`;
            return {
                name: e.name,
                item: [
                    { name: `List ${e.name}`, request: { method: 'GET', url: `${base}` } },
                    { name: `Get ${e.name} by id`, request: { method: 'GET', url: `${base}/:id` } },
                    { name: `Create ${e.name}`, request: { method: 'POST', url: `${base}`, header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{}' } } },
                    { name: `Update ${e.name}`, request: { method: 'PUT', url: `${base}/:id`, header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{}' } } },
                    { name: `Delete ${e.name}`, request: { method: 'DELETE', url: `${base}/:id` } },
                ]
            };
        });
        return { info: { name: 'ModelEditor – API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, variable, item };
    }
    tpl(relPath, ctx) {
        const fs = require('node:fs');
        const path = require('node:path');
        const Handlebars = require('handlebars');
        if (!Handlebars.helpers.eq) {
            Handlebars.registerHelper('eq', (a, b) => a === b);
        }
        if (!Handlebars.helpers.lower) {
            Handlebars.registerHelper('lower', (s) => (s ?? '').toString().toLowerCase());
        }
        if (!Handlebars.helpers.some) {
            Handlebars.registerHelper('some', (arr, val) => Array.isArray(arr) && arr.some((it) => (typeof it === 'string' ? it : it.javaType) === val));
        }
        if (!Handlebars.helpers.json) {
            Handlebars.registerHelper('json', (obj) => JSON.stringify(obj));
        }
        const fromDist = path.join(__dirname, 'templates', relPath);
        const fromSrc = path.join(process.cwd(), 'src', 'codegen', 'templates', relPath);
        const full = fs.existsSync(fromDist) ? fromDist : (fs.existsSync(fromSrc) ? fromSrc : null);
        if (!full) {
            throw new Error(`Template not found: ${relPath}
            Checked:
            - ${fromDist}
            - ${fromSrc}`);
        }
        const src = fs.readFileSync(full, 'utf-8');
        const compiled = Handlebars.compile(src, { noEscape: true });
        return compiled(ctx);
    }
};
exports.CodegenService = CodegenService;
exports.CodegenService = CodegenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CodegenService);
//# sourceMappingURL=codegen.service.js.map