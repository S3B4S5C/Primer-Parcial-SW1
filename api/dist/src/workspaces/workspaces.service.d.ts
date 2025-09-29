import { PrismaService } from '../prisma/prisma.service';
export declare class WorkspacesService {
    private prisma;
    constructor(prisma: PrismaService);
    listForUser(userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        projectCount: number;
    }[]>;
}
