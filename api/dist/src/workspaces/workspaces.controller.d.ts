import type { Request } from 'express';
import { WorkspacesService } from './workspaces.service';
export declare class WorkspacesController {
    private readonly svc;
    constructor(svc: WorkspacesService);
    list(req: Request): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        projectCount: number;
    }[]>;
}
