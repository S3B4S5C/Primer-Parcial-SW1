import { PrismaService } from '../prisma/prisma.service';
export declare class CollaboratorsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(projectId: string): Promise<{
        id: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            avatarUrl: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        };
        role: import("@prisma/client").$Enums.ProjectRole;
        addedAt: Date;
    }[]>;
    private ensureNotLastOwner;
    add(projectId: string, actorId: string, dto: {
        role: 'OWNER' | 'EDITOR' | 'READER';
        userId?: string;
        email?: string;
    }): Promise<{
        id: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            avatarUrl: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        };
        role: import("@prisma/client").$Enums.ProjectRole;
        addedAt: Date;
    }[]>;
    updateRole(projectId: string, memberId: string, newRole: 'OWNER' | 'EDITOR' | 'READER', actorId: string): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.ProjectRole;
        userId: string;
        addedAt: Date;
        projectId: string;
    }>;
    remove(projectId: string, memberId: string, actorId: string): Promise<{
        ok: boolean;
    }>;
    audit(projectId: string): Promise<{
        id: string;
        createdAt: Date;
        workspaceId: string | null;
        projectId: string | null;
        action: import("@prisma/client").$Enums.AuditAction;
        targetType: string;
        targetId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actorId: string | null;
    }[]>;
    searchUsersInWorkspace(projectId: string, q: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
    }[]>;
}
