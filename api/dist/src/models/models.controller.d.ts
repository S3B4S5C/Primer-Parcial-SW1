import type { Request } from 'express';
import { ModelsService } from './models.service';
import { SaveModelDto } from './dto/save-model.dto';
export declare class ModelsController {
    private readonly svc;
    constructor(svc: ModelsService);
    getCurrent(projectId: string, branchId: string | undefined, req: Request): Promise<{
        branchId: string;
        versionId: string;
        content: import("@prisma/client/runtime/library").JsonValue;
    }>;
    saveNewVersion(projectId: string, dto: SaveModelDto & {
        content: any;
    }, req: Request): Promise<{
        versionId: string;
        createdAt: Date;
    }>;
}
