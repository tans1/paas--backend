import { Module } from '@nestjs/common';
import { MetricsService } from './metrics/metrics.service';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../../infrastructure/database/redis/redis.module';
import { PaymentService } from './payment/payment.service';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
@Module({
  imports: [HttpModule, RedisModule, PrismaModule],
  providers: [MetricsService, PaymentService],
})
export class UsageMetricsModule {}
