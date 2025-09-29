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
                name: string;
                color: string | null;
                workspaceId: string;
            };
        } & {
            tagId: string;
            projectId: string;
        })[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        workspaceId: string;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
    })[]>;
    get(id: string, req: Request): Promise<{
        members: {
            role: import("@prisma/client").$Enums.ProjectRole;
        }[];
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string | null;
                workspaceId: string;
            };
        } & {
            tagId: string;
            projectId: string;
        })[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        workspaceId: string;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
    }>;
    createInWorkspace(workspaceId: string, dto: CreateProjectDto, req: Request): Promise<({
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string | null;
                workspaceId: string;
            };
        } & {
            tagId: string;
            projectId: string;
        })[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        workspaceId: string;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
    }) | null>;
    update(id: string, dto: UpdateProjectDto, req: Request): Promise<({
        tags: ({
            tag: {
                id: string;
                name: string;
                color: string | null;
                workspaceId: string;
            };
        } & {
            tagId: string;
            projectId: string;
        })[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        workspaceId: string;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
    }) | null>;
    archive(id: string, req: Request): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        workspaceId: string;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
    }>;
    restore(id: string, req: Request): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        workspaceId: string;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
    }>;
    remove(id: string, req: Request): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        workspaceId: string;
        archivedAt: Date | null;
        deletedAt: Date | null;
        legalHold: boolean;
    }>;
}
