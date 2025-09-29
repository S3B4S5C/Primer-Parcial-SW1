import { AuthService } from './auth.service';
import { RegisterDto } from 'src/projects/dto/register.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
        };
    }>;
    me(req: any): Promise<{
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
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
        };
    }>;
}
