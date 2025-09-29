"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
function roomOf(p) {
    return p.branchId ? `project:${p.projectId}:branch:${p.branchId}` : `project:${p.projectId}`;
}
let RealtimeGateway = class RealtimeGateway {
    jwt;
    prisma;
    log = new common_1.Logger('RealtimeGateway');
    server;
    constructor(jwt, prisma) {
        this.jwt = jwt;
        this.prisma = prisma;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers['authorization']?.split(' ')[1];
            if (!token)
                throw new Error('No token');
            const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
            client.data.userId = payload.sub || payload.userId;
            this.log.debug(`WS connect ${client.id} user:${client.data.userId}`);
        }
        catch {
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        this.log.debug(`WS disconnect ${client.id}`);
    }
    async assertCanRead(userId, projectId) {
        const mem = await this.prisma.projectMember.findFirst({ where: { projectId, userId } });
        if (!mem)
            throw new Error('forbidden');
    }
    async assertCanEdit(userId, projectId) {
        const mem = await this.prisma.projectMember.findFirst({ where: { projectId, userId, role: { in: ['OWNER', 'EDITOR'] } } });
        if (!mem)
            throw new Error('forbidden');
    }
    async onJoin(data, client) {
        const userId = client.data.userId;
        await this.assertCanRead(userId, data.projectId);
        const room = roomOf(data);
        client.join(room);
        this.log.debug(`join user:${userId} room:${room}`);
        client.emit('joined', { room });
    }
    async onPatch(msg, client) {
        const userId = client.data.userId;
        await this.assertCanEdit(userId, msg.projectId);
        const room = roomOf(msg);
        this.log.debug(`patch from:${client.id} room:${room}`);
        client.to(room).emit('patch', { patch: msg.patch, from: client.id, clientTs: msg.clientTs ?? Date.now() });
    }
    onReplace(msg, client) {
        const room = roomOf(msg);
        client.to(room).emit('replace', { model: msg.patch, from: client.id });
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "onJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('patch'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "onPatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('replace'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onReplace", null);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/ws',
        cors: { origin: (process.env.WS_ORIGIN?.split(',') ?? ['http://localhost:4200']), credentials: true }
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, prisma_service_1.PrismaService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map