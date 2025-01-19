import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { DeployModule } from './deploy/deploy.module';
import { ClientController } from './client.controller';
import { EventsModule } from '../events/event.module';

@Module({
  imports: [UploadModule, DeployModule, EventsModule],
  controllers: [ClientController],
})
export class ClientModule {}
