import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId: string) {
    // Nota: valida rol/permiso del user sobre el workspace en una capa de guard/servicio aparte
    try {
      return await this.prisma.project.create({
        data: {
          name: dto.name,
          description: dto.description,
          workspace: { connect: { id: dto.workspaceId } },
          createdBy: { connect: { id: userId } },
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') { // unique constraint
        throw new BadRequestException('Ya existe un proyecto con ese nombre en este espacio.');
      }
      throw e;
    }
  }

  findAllByWorkspace(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } } },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  archive(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  restore(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: 'ACTIVE', archivedAt: null },
    });
  }

  softDelete(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
