import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { DeployModule } from './deploy/deploy.module';
import { ClientController } from './client.controller';
import { EventsModule } from '../events/event.module';
import { AlsModule } from '../../utils/als/als.module';
import { AlsService } from '@/utils/als/als.service';
import { UsersModule } from '@/resources/users/users.module';

@Module({
  imports: [UploadModule, DeployModule, EventsModule, AlsModule, UsersModule],
  providers: [AlsService],
  controllers: [ClientController],
})
export class ClientModule {}
