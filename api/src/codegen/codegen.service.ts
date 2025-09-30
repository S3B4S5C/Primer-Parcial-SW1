import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Handlebars from 'handlebars';
import * as archiver from 'archiver';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import type { Artifact, $Enums } from '@prisma/client';

type ArtifactType = 'SPRING_BOOT_PROJECT' | 'SQL_DDL' | 'MIGRATIONS_FLYWAY' | 'OPENAPI_SPEC' | 'POSTMAN_COLLECTION';
type DbEngine = 'POSTGRESQL' | 'MYSQL' | 'MARIADB' | 'SQLSERVER';
type ArtifactSummary = Pick<Artifact, 'id' | 'type' | 'storageKey' | 'createdAt'>;

export class GenerateDto {
    types: $Enums.ArtifactType[]; // p.ej. ["SPRING_BOOT_PROJECT","POSTMAN_COLLECTION"]
    packageBase: string;
    dbEngine?: 'POSTGRESQL' | 'MYSQL' | 'MARIADB' | 'SQLSERVER';
    migrationTool?: 'FLYWAY' | 'LIQUIBASE';
    branchId?: string;
    modelVersionId?: string;
}

@Injectable()
export class CodegenService {
    constructor(private prisma: PrismaService) { }

    // ===== Utilidades =====
    private ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }); }
    private sha256(filePath: string) {
        const h = createHash('sha256'); h.update(fs.readFileSync(filePath)); return h.digest('hex');
    }

    // TIPOS del editor → Java/SQL (puedes extenderlo)
    private mapTypeToJava(t: string) {
        const k = t.toLowerCase();
        if (k.includes('uuid')) return 'java.util.UUID';
        if (k.includes('int')) return 'java.lang.Integer';
        if (k.includes('bigint') || k === 'long') return 'java.lang.Long';
        if (k.includes('bool')) return 'java.lang.Boolean';
        if (k.includes('date')) return 'java.time.LocalDate';
        if (k.includes('time')) return 'java.time.Instant';
        return 'java.lang.String';
    }
    private mapTypeToSql(t: string, db: DbEngine) {
        const k = t.toLowerCase();
        if (k.includes('uuid')) return db === 'POSTGRESQL' ? 'uuid' : 'char(36)';
        if (k.includes('int')) return 'integer';
        if (k.includes('bigint') || k === 'long') return 'bigint';
        if (k.includes('bool')) return 'boolean';
        if (k.includes('date')) return 'date';
        if (k.includes('time')) return 'timestamp';
        return 'varchar(255)';
    }

    private sanitizeId(s: string) {
        return s.replace(/[^\w]/g, '');
    }

    // ===== Modelo intermedio desde tu DSL (GoJS model) =====
    private async loadIR(projectId: string, branchId?: string, modelVersionId?: string) {
        // 1) rama por defecto
        let bid = branchId;
        if (!bid) {
            const def = await this.prisma.branch.findFirst({ where: { projectId, isDefault: true } });
            if (!def) throw new BadRequestException('No default branch');
            bid = def.id;
        }

        // 2) versión (última si no se pasa)
        const mv = modelVersionId
            ? await this.prisma.modelVersion.findUnique({ where: { id: modelVersionId } })
            : await this.prisma.modelVersion.findFirst({
                where: { projectId, branchId: bid },
                orderBy: { createdAt: 'desc' },
            });

        if (!mv) throw new BadRequestException('No model version to generate from');

        // 3) parseo flexible
        const raw = mv.content as any;
        const model = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // ====== CASO A: DSL { entities, relations } ======
        if (Array.isArray(model?.entities)) {
            const entities = (model.entities as any[]).map((e) => {
                const className = this.sanitizeId((e.name ?? 'Entity').toString().trim().replace(/\s+/g, ''));
                const route = className.charAt(0).toLowerCase() + className.slice(1);
                const table = className.toLowerCase();
                const fields = (Array.isArray(e.attrs) ? e.attrs : []).map((a: any) => ({
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

            const rels = (Array.isArray(model.relations) ? model.relations : []).map((r: any) => ({
                from: this.sanitizeId((r.from || '').toString().replace(/\s+/g, '')),
                to: this.sanitizeId((r.to || '').toString().replace(/\s+/g, '')),
                kind: r.kind || 'association',
                fromCard: r.fromCard || 'N',
                toCard: r.toCard || '1',
            }));

            return { entities, rels, modelVersionId: mv.id };
        }

        // ====== CASO B: GoJS { nodeDataArray, linkDataArray } (o anidados) ======
        const candidates = [
            model,
            model?.model,
            model?.diagram,
            model?.patch,
            model?.content,
        ].filter(Boolean);

        const payload =
            candidates.find((c: any) => Array.isArray(c?.nodeDataArray) && Array.isArray(c?.linkDataArray)) ??
            candidates.find((c: any) => Array.isArray(c?.nodeDataArray)) ??
            {};

        const nodes = Array.isArray((payload as any).nodeDataArray) ? (payload as any).nodeDataArray : [];
        const links = Array.isArray((payload as any).linkDataArray) ? (payload as any).linkDataArray : [];

        if (!nodes.length) {
            throw new BadRequestException('El modelo está vacío. Guarda el diagrama y vuelve a generar.');
        }

        const entities = nodes.map((n: any) => {
            const name = (n.name ?? n.key ?? 'Entity').toString().trim();
            const className = this.sanitizeId(name.replace(/\s+/g, ''));
            const route = className.charAt(0).toLowerCase() + className.slice(1);
            const table = className.toLowerCase();
            const attrs = Array.isArray(n.attrs) ? n.attrs : [];
            const fields = attrs.map((a: any) => ({
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

        const rels = links.map((l: any) => ({
            from: this.sanitizeId((l.from || '').toString().replace(/\s+/g, '')),
            to: this.sanitizeId((l.to || '').toString().replace(/\s+/g, '')),
            kind: l.kind || 'association',
            fromCard: l.fromCard || 'N',
            toCard: l.toCard || '1',
        }));

        return { entities, rels, modelVersionId: mv.id };
    }


    // ====== GENERACIÓN ======
    async generateArtifacts(projectId: string, dto: GenerateDto) {
        const types = dto.types?.length ? dto.types : ['SPRING_BOOT_PROJECT', 'POSTMAN_COLLECTION'];
        const pkg = dto.packageBase || 'com.acme.demo';
        const db: DbEngine = dto.dbEngine || 'POSTGRESQL';
        const mig = dto.migrationTool || 'FLYWAY';

        const { entities, rels, modelVersionId } = await this.loadIR(projectId, dto.branchId, dto.modelVersionId);

        // carpeta temporal
        const outDir = path.join(process.cwd(), 'storage', 'work', `${projectId}-${Date.now()}`);
        this.ensureDir(outDir);

        const artifacts: { type: ArtifactType, file: string, storageKey: string }[] = [];

        // 1) SPRING BOOT PROJECT (ZIP)
        if (types.includes('SPRING_BOOT_PROJECT')) {
            const zipPath = path.join(outDir, `springboot-${projectId}.zip`);
            await this.buildSpringBootZip(zipPath, { pkg, db, mig, entities, rels });
            artifacts.push({ type: 'SPRING_BOOT_PROJECT', file: zipPath, storageKey: `work/${path.basename(outDir)}/${path.basename(zipPath)}` });
        }

        // 2) SQL DDL (archivo suelto)
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

        // 3) POSTMAN (colección)
        if (types.includes('POSTMAN_COLLECTION')) {
            const pm = this.renderPostman({ pkg, entities });
            const pmPath = path.join(outDir, `postman-${projectId}.json`);
            fs.writeFileSync(pmPath, JSON.stringify(pm, null, 2), 'utf-8');
            artifacts.push({ type: 'POSTMAN_COLLECTION', file: pmPath, storageKey: `work/${path.basename(outDir)}/${path.basename(pmPath)}` });
        }

        // 4) OPENAPI (lo damos vía springdoc al ejecutar el app generado)
        if (types.includes('OPENAPI_SPEC')) {
            const oaPath = path.join(outDir, `openapi-note.txt`);
            fs.writeFileSync(oaPath, `El proyecto Spring Boot generado incluye springdoc-openapi. Levanta la app y visita /v3/api-docs`, 'utf-8');
            artifacts.push({ type: 'OPENAPI_SPEC', file: oaPath, storageKey: `work/${path.basename(outDir)}/${path.basename(oaPath)}` });
        }

        // Mover a storage/ y persistir Artifact
        const saved: ArtifactSummary[] = [];
        for (const a of artifacts) {
            const dest = path.join(process.cwd(), 'storage', a.storageKey);
            this.ensureDir(path.dirname(dest));
            fs.copyFileSync(a.file, dest);
            const size = fs.statSync(dest).size;
            const sum = this.sha256(dest);
            const rec: ArtifactSummary = await this.prisma.artifact.create({
                data: {
                    projectId,
                    modelVersionId,
                    type: a.type as any,                 // o mapea tu string a $Enums.ArtifactType
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

    // ====== Renderizadores ======
    private async buildSpringBootZip(zipPath: string, ctx: any) {
        const fs = await import('node:fs');
        const path = await import('node:path');

        // asegúrate de que exista la carpeta destino
        fs.mkdirSync(path.dirname(zipPath), { recursive: true });

        const output = fs.createWriteStream(zipPath);
        const archive = archiver.create('zip', { zlib: { level: 9 } });

        // maneja errores del stream/archiver
        const done = new Promise<void>((resolve, reject) => {
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

    private renderDDL(ctx: any) {
        const lines: string[] = [];
        for (const e of ctx.entities) {
            lines.push(`CREATE TABLE IF NOT EXISTS "${e.table}" (`);
            const cols = e.fields.map((f: any) => {
                const notnull = f.nullable ? '' : ' NOT NULL';
                const unique = f.unique ? ' UNIQUE' : '';
                return `  "${f.name}" ${f.sqlType}${notnull}${unique}`;
            });
            // PK
            cols.push(`  PRIMARY KEY ("${e.idField.name}")`);
            lines.push(cols.join(',\n'));
            lines.push(');');
            lines.push('');
        }
        return lines.join('\n');
    }

    private renderPostman({ entities }: any) {
        const variable = [{ key: 'baseUrl', value: 'http://localhost:8080', type: 'string' }];
        const item = entities.map((e: any) => {
            const base = `{{baseUrl}}/${e.route}`;
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

    private tpl(relPath: string, ctx: any) {
        const fs = require('node:fs');
        const path = require('node:path');
        const Handlebars = require('handlebars');

        // === Helpers (solo si no existen) ===
        if (!Handlebars.helpers.eq) {
            Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
        }
        if (!Handlebars.helpers.lower) {
            Handlebars.registerHelper('lower', (s: any) => (s ?? '').toString().toLowerCase());
        }
        if (!Handlebars.helpers.some) {
            // útil si tu template pregunta: {{#if (some fields "java.util.UUID")}}...
            Handlebars.registerHelper('some', (arr: any[], val: any) =>
                Array.isArray(arr) && arr.some((it: any) => (typeof it === 'string' ? it : it.javaType) === val)
            );
        }
        if (!Handlebars.helpers.json) {
            Handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj));
        }

        // Rutas dev/dist robustas
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

}
