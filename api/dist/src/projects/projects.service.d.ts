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
    getByIdAuthorized(projectId: string, userId: string): Promise<{
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
    create(workspaceId: string, userId: string, dto: {
        name: string;
        description?: string;
        tags?: string[];
    }): Promise<({
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
    updateMetadata(projectId: string, userId: string, dto: {
        name?: string;
        description?: string;
        tags?: string[];
    }): Promise<({
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
    archive(projectId: string, userId: string): Promise<{
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
    restore(projectId: string, userId: string): Promise<{
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
    softDelete(projectId: string, userId: string): Promise<{
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
