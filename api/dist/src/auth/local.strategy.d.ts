import { AuthService } from './auth.service';
declare const LocalStrategy_base: new (...args: any) => any;
export declare class LocalStrategy extends LocalStrategy_base {
    private auth;
    constructor(auth: AuthService);
    validate(email: string, password: string): Promise<{
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
}
export {};
