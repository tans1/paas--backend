import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { ListService } from './list/list.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ConnectService } from './connect/connect.service';
import { InterfacesModule } from '../../infrastructure/database/interfaces/interfaces.module';
import { OctokitService } from './octokit/octokit.service';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [RepositoriesController],
  providers: [
    ListService,
    WebhooksService,
    ConnectService,
    OctokitService,
    UsersService,
  ],
  imports: [InterfacesModule],
})
export class RepositoriesModule {}
