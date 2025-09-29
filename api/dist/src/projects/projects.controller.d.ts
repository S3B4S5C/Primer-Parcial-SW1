import type { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsController {
    private readonly svc;
    constructor(svc: ProjectsService);
    list(workspaceId: string, req: Request): Promise<({
        tags: ({
            tag: {
                id: string;
                workspaceId: string;
                name: string;
                color: string | null;
            };
        } & {
            projectId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        workspaceId: string;
        name: string;
        description: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    get(id: string, req: Request): Promise<{
        members: {
            role: import("@prisma/client").$Enums.ProjectRole;
        }[];
        tags: ({
            tag: {
                id: string;
                workspaceId: string;
                name: string;
                color: string | null;
            };
        } & {
            projectId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        workspaceId: string;
        name: string;
        description: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createInWorkspace(workspaceId: string, dto: CreateProjectDto, req: Request): Promise<({
        tags: ({
            tag: {
                id: string;
                workspaceId: string;
                name: string;
                color: string | null;
            };
        } & {
            projectId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        workspaceId: string;
        name: string;
        description: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    update(id: string, dto: UpdateProjectDto, req: Request): Promise<({
        tags: ({
            tag: {
                id: string;
                workspaceId: string;
                name: string;
                color: string | null;
            };
        } & {
            projectId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        workspaceId: string;
        name: string;
        description: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    archive(id: string, req: Request): Promise<{
        id: string;
        workspaceId: string;
        name: string;
        description: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    restore(id: string, req: Request): Promise<{
        id: string;
        workspaceId: string;
        name: string;
        description: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: Request): Promise<{
        id: string;
        workspaceId: string;
        name: string;
        description: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
