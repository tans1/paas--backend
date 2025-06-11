import { Module } from '@nestjs/common';
import { MetricsService } from './metrics/metrics.service';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../../infrastructure/database/redis/redis.module';
import { CostService } from './cost/cost.service';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { ContainerSetupModule } from '../container-setup/container-setup.module';
@Module({
  imports: [HttpModule, RedisModule, PrismaModule, ContainerSetupModule],
  providers: [MetricsService, CostService],
})
export class UsageMetricsModule {}
