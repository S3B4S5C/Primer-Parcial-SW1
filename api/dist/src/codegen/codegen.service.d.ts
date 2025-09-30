import { PrismaService } from '../prisma/prisma.service';
import type { Artifact, $Enums } from '@prisma/client';
type ArtifactSummary = Pick<Artifact, 'id' | 'type' | 'storageKey' | 'createdAt'>;
export declare class GenerateDto {
    types: $Enums.ArtifactType[];
    packageBase: string;
    dbEngine?: 'POSTGRESQL' | 'MYSQL' | 'MARIADB' | 'SQLSERVER';
    migrationTool?: 'FLYWAY' | 'LIQUIBASE';
    branchId?: string;
    modelVersionId?: string;
}
export declare class CodegenService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureDir;
    private sha256;
    private mapTypeToJava;
    private mapTypeToSql;
    private sanitizeId;
    private loadIR;
    generateArtifacts(projectId: string, dto: GenerateDto): Promise<{
        ok: boolean;
        artifacts: ArtifactSummary[];
    }>;
    private buildSpringBootZip;
    private renderDDL;
    private renderPostman;
    private tpl;
}
export {};
