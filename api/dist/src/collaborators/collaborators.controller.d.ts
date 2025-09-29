import type { Request } from 'express';
import { CollaboratorsService } from './collaborators.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class CollaboratorsController {
    private readonly svc;
    constructor(svc: CollaboratorsService);
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
    add(projectId: string, dto: AddMemberDto, req: Request): Promise<{
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
    updateRole(projectId: string, memberId: string, dto: UpdateRoleDto, req: Request): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.ProjectRole;
        userId: string;
        addedAt: Date;
        projectId: string;
    }>;
    remove(projectId: string, memberId: string, req: Request): Promise<{
        ok: boolean;
    }>;
    search(projectId: string, q?: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
    }[]>;
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
}
