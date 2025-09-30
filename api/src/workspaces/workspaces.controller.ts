import { Controller, Get, UseGuards, Req, Post } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards';
import { WorkspacesService } from './workspaces.service';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly svc: WorkspacesService) {}

  @Get()
  list(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.svc.listForUser(userId);
  }

  @Get('mine')
  async mine(@Req() req) {
    return this.svc.listMine(req.user.id);
  }

  @Post('personal')
  async personal(@Req() req) {
    return this.svc.ensurePersonalWorkspace(req.user.id);
  }

}
