import { PrismaService } from '../prisma/prisma.service';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureTags;
    private syncProjectTags;
    private checkWorkspaceQuota;
    private audit;
    listAccessible(userId: string, workspaceId?: string): Promise<({
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
    getByIdAuthorized(projectId: string, userId: string): Promise<{
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
    create(workspaceId: string, userId: string, dto: {
        name: string;
        description?: string;
        tags?: string[];
    }): Promise<({
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
    updateMetadata(projectId: string, userId: string, dto: {
        name?: string;
        description?: string;
        tags?: string[];
    }): Promise<({
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
    archive(projectId: string, userId: string): Promise<{
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
    restore(projectId: string, userId: string): Promise<{
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
    softDelete(projectId: string, userId: string): Promise<{
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
