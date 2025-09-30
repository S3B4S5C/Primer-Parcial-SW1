import type { Response } from 'express';
import { CodegenService, GenerateDto } from './codegen.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class CodegenController {
    private svc;
    private prisma;
    constructor(svc: CodegenService, prisma: PrismaService);
    generate(projectId: string, body: GenerateDto): Promise<{
        ok: boolean;
        artifacts: {
            id: string;
            type: import("@prisma/client").$Enums.ArtifactType;
            storageKey: string;
            createdAt: Date;
        }[];
    }>;
    list(projectId: string): Promise<{
        sizeBytes: string | null;
        id: string;
        modelVersionId: string | null;
        codegenConfigId: string | null;
        type: import("@prisma/client").$Enums.ArtifactType;
        storageBucket: string;
        storageKey: string;
        checksumSha256: string | null;
        createdAt: Date;
    }[]>;
    download(projectId: string, artifactId: string, res: Response): Promise<void>;
}
