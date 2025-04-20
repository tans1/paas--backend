import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { ListService } from './list/list.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ConnectService } from './connect/connect.service';
import { InterfacesModule } from '../../infrastructure/database/interfaces/interfaces.module';
import { OctokitService } from './octokit/octokit.service';
import { UsersService } from '../users/users.service';
import { ProjectService } from '../projects/create-project/project.service';
import { AlsModule } from '@/utils/als/als.module';
import { ProjectsModule } from '../projects/projects.module';
import { EnvironmentService } from './utils/environment.service';

@Module({
  controllers: [RepositoriesController],
  providers: [
    ListService,
    WebhooksService,
    ConnectService,
    OctokitService,
    UsersService,
    ProjectService,
    EnvironmentService,
  ],
  imports: [
    InterfacesModule,
    AlsModule,
    ProjectsModule,
  ],
})
export class RepositoriesModule {}
