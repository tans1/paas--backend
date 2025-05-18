import { Module } from '@nestjs/common';
import { MetricsService } from './metrics/metrics.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [MetricsService],
})
export class UsageMetricsModule {}
