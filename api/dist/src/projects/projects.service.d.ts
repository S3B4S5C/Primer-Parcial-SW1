import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateProjectDto, userId: string): Promise<{
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
    findAllByWorkspace(workspaceId: string): import("@prisma/client").Prisma.PrismaPromise<({
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
    findOne(id: string): Promise<{
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
    update(id: string, dto: UpdateProjectDto): Promise<{
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
    archive(id: string): import("@prisma/client").Prisma.Prisma__ProjectClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    restore(id: string): import("@prisma/client").Prisma.Prisma__ProjectClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    softDelete(id: string): import("@prisma/client").Prisma.Prisma__ProjectClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
