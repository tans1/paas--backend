import { Module } from '@nestjs/common';
import { DnsController } from './dns.controller';
import { DnsService } from './dns.service';

@Module({
  controllers: [DnsController],
  providers: [DnsService]
})
export class DnsModule {}
