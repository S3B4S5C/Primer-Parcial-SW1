import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
export declare class WorkspaceRoleGuard implements CanActivate {
    private prisma;
    private reflector;
    constructor(prisma: PrismaService, reflector: Reflector);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
