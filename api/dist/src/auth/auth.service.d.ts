import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    validateUser(email: string, password: string): Promise<{
        id: string;
        email: string;
        externalId: string | null;
        name: string | null;
        passwordHash: string | null;
        avatarUrl: string | null;
        authProvider: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(user: {
        id: string;
        email: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
        };
    }>;
    me(userId: string): Promise<{
        id: string;
        email: string;
        externalId: string | null;
        name: string | null;
        passwordHash: string | null;
        avatarUrl: string | null;
        authProvider: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
