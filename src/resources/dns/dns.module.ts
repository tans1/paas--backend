import { Module } from '@nestjs/common';
import { DnsController } from './dns.controller';
import { DnsService } from './dns.service';
import { BullModule } from '@nestjs/bullmq';
import { DnsJobProcessor } from './dns-job.processor';
import { InterfacesModule } from '../../infrastructure/database/interfaces/interfaces.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'dns-propagation',
    }),
    InterfacesModule,
    NotificationModule
  ],
  controllers: [DnsController],
  providers: [DnsService, DnsJobProcessor],
})
export class DnsModule {}
