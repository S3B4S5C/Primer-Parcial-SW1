import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
type JoinMsg = {
    projectId: string;
    branchId?: string;
};
type PatchMsg = {
    projectId: string;
    branchId?: string;
    patch: any;
    clientTs?: number;
};
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    private prisma;
    private readonly log;
    server: Server;
    constructor(jwt: JwtService, prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    private assertCanRead;
    private assertCanEdit;
    onJoin(data: JoinMsg, client: Socket): Promise<void>;
    onPatch(msg: PatchMsg, client: Socket): Promise<void>;
    onReplace(msg: PatchMsg, client: Socket): void;
}
export {};
