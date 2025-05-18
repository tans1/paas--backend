import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { ListService } from './list/list.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ConnectService } from './connect/connect.service';
import { InterfacesModule } from '../../infrastructure/database/interfaces/interfaces.module';
import { OctokitService } from '../../utils/octokit/octokit.service';
import { UsersService } from '../users/users.service';
import { ProjectService } from '../projects/create-project/project.service';
import { AlsModule } from '@/utils/als/als.module';
import { ProjectsModule } from '../projects/projects.module';
import { GitHubFileService } from '../../utils/octokit/github-services/github-file.service';
import { OctoktModule } from '@/utils/octokit/octokit.module';
import { FrameworkDetectorModule } from '@/core/framework-detector/framework-detector.module';
import { EnvironmentModule } from '@/utils/environment/environment.module';

@Module({
  controllers: [RepositoriesController],
  providers: [
    ListService,
    WebhooksService,
    ConnectService,
    OctokitService,
    UsersService,
    ProjectService,
    GitHubFileService,
  ],
  imports: [
    InterfacesModule,
    AlsModule,
    ProjectsModule,
    OctoktModule,
    FrameworkDetectorModule,
    EnvironmentModule,
  ],
  exports: [GitHubFileService,ConnectService],
})
export class RepositoriesModule {}
