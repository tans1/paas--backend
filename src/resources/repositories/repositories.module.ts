import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { ListService } from './list/list.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ConnectService } from './connect/connect.service';
import { InterfacesModule } from '../../infrastructure/database/interfaces/interfaces.module';
import { OctokitService } from './octokit/octokit.service';
import { AlsModule } from '@/utils/als/als.module';

@Module({
  controllers: [RepositoriesController],
  providers: [ListService, WebhooksService, ConnectService, OctokitService],
  imports: [InterfacesModule,AlsModule],
})
export class RepositoriesModule {}
