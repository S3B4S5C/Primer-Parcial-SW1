import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ModelsModule } from './models/models.module'
import { CollaboratorsModule } from './collaborators/collaborators.module';
import { VersionsModule } from './versions/versions.module';
import { RealtimeModule } from './realtime/realtime.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectsModule,
    AuthModule,
    WorkspacesModule,
    ModelsModule,
    CollaboratorsModule,
    VersionsModule,
    RealtimeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
