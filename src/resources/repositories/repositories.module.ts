import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { ListService } from './list/list.service';
import { WebhooksService } from './webhooks/webhooks.service';

@Module({
  controllers: [RepositoriesController],
  providers: [ListService, WebhooksService],
})
export class RepositoriesModule {}
