import { DailyMetric } from '@prisma/client';

interface DailyMetricFromRedis {
  containerName: string;
  date: Date;
  cpuSeconds: number;
  memoryBytes: number;
  netRxBytes: number;
  netTxBytes: number;
}

export abstract class MetricsRepositoryInterface {
  abstract createDailyMetics(
    payload: DailyMetricFromRedis,
  ): Promise<DailyMetric>;

  abstract groupDailyMetrics(
    containerName: string,
    firstDay: string,
    lastDay: string,
  ): Promise<DailyMetric>;
}
