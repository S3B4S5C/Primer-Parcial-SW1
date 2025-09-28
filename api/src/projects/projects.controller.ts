import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    const userId = 'demo-user-id'; // TODO: extraer de auth (JWT/Keycloak)
    return this.svc.create(dto, userId);
  }

  @Get()
  list(@Query('workspaceId') workspaceId: string) {
    return this.svc.findAllByWorkspace(workspaceId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.svc.update(id, dto);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.svc.archive(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.svc.restore(id);
  }

  @Post(':id/delete')
  softDelete(@Param('id') id: string) {
    return this.svc.softDelete(id);
  }
}
