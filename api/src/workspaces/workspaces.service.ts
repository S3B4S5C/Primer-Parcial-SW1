import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) { }

  async listForUser(userId: string) {
    const rows = await this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      select: {
        id: true, name: true, slug: true, description: true, createdAt: true,
        members: { where: { userId }, select: { role: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      role: r.members[0]?.role ?? 'MEMBER',
      projectCount: r._count.projects,
    }));
  }
  async ensurePersonalWorkspace(userId: string) {
    let ws = await this.prisma.workspace.findFirst({
      where: { createdById: userId, name: 'Personal' },
    });
    if (ws) return ws;

    // slug único: u-<8 primeros del id>[-n]
    const base = `u-${userId.slice(0, 8)}`;
    let slug = base;
    let i = 1;
    // Evita colisiones
    while (await this.prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }

    ws = await this.prisma.workspace.create({
      data: {
        name: 'Personal',
        slug,
        description: 'Tu espacio personal',
        createdById: userId,
        // marca opcional en settings
        settings: { type: 'personal' } as any,
      },
    });

    await this.prisma.workspaceMember.create({
      data: { workspaceId: ws.id, userId, role: 'OWNER' },
    });

    return ws;
  }

  async listMine(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
