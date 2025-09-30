// src/app/core/realtime.service.ts
import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment
  
 } from '../../../environments/environment.prod';
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket?: Socket;
  connected = signal(false);

  connectWithToken(token: string) {
    if (this.socket) return;
    this.socket = io(environment.wsUrl, {
      transports: ['websocket'],
      path: '/socket.io',
      auth: { token }
    });

    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
  }

  /** Llama a esto solo cuando connected() sea true y tengas projectId/branchId */
  join(room: { projectId: string; branchId?: string }) {
    this.socket?.emit('join', room);
  }

  onJoined(cb: (info: { room: string }) => void) {
    const h = (info: any) => cb(info);
    this.socket?.on('joined', h);
    return () => this.socket?.off('joined', h);
  }

  sendPatch(payload: { projectId: string; branchId?: string; patch: any }) {
    this.socket?.emit('patch', { ...payload, clientTs: Date.now() });
  }

  onPatch(cb: (msg: { patch: any; from: string; clientTs: number }) => void) {
    const h = (msg: any) => cb(msg);
    this.socket?.on('patch', h);
    return () => this.socket?.off('patch', h);
  }
}
