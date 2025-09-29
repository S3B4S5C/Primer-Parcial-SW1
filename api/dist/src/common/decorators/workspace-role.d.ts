export declare const WORKSPACE_ROLES_KEY = "workspaceRoles";
export declare const RequireWorkspaceRole: (...roles: Array<"OWNER" | "ADMIN" | "MEMBER">) => import("@nestjs/common").CustomDecorator<string>;
