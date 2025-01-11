import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { ListService } from './list/list.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ConnectService } from './connect/connect.service';
import { OctokitService } from './utils/octokit';
import { InterfacesModule } from '../../infrastructure/database/interfaces/interfaces.module';

@Module({
  controllers: [RepositoriesController],
  providers: [ListService, WebhooksService, ConnectService, OctokitService],
  imports: [InterfacesModule],
})
export class RepositoriesModule {}
