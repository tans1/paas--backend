import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';
import { NotificationController } from './notification.controller';
import { NotificationQueueService } from './notification-queue.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationQueueService
  ],
  imports:[InterfacesModule],

  exports: [NotificationService,NotificationQueueService],
})
export class NotificationModule {}
