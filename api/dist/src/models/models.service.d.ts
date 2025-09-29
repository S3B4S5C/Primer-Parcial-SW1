import { PrismaService } from '../prisma/prisma.service';
type DSL = {
    entities: Array<{
        id?: string;
        name: string;
        stereotype?: string;
        attrs: Array<{
            name: string;
            type: string;
            pk?: boolean;
            unique?: boolean;
            nullable?: boolean;
        }>;
    }>;
    relations: Array<{
        from: string;
        to: string;
        kind: 'association' | 'aggregation' | 'composition';
        fromCard?: string;
        toCard?: string;
        fk?: string;
        onDelete?: 'cascade' | 'restrict' | 'setnull';
    }>;
    constraints?: any[];
};
export declare class ModelsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getOrCreateDefaultBranch;
    private latestVersion;
    getCurrent(projectId: string, userId: string, branchId?: string): Promise<{
        branchId: string;
        versionId: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }>;
    private validateDSL;
    saveNewVersion(projectId: string, userId: string, body: {
        branchId?: string;
        message?: string;
        content: DSL;
    }): Promise<{
        versionId: string;
        createdAt: Date;
    }>;
}
export {};
