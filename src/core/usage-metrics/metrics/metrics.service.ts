import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

interface ContainerMetric {
  id: string;
  spec: {
    labels: Record<string, string>;
  };
  aliases: string[];
  stats: {
    timestamp: string;
    cpu: {
      usage: {
        total: number;
      };
    };
    memory: {
      usage: number;
    };
    network: {
      interfaces: {
        rx_bytes: number;
        tx_bytes: number;
      }[];
    };
  }[];
}

interface MonthlyAggregate {
  containerName: string;
  periodStart: Date;
  periodEnd: Date;
  totalCpuSecs: number;
  totalMemGbHrs: number;
  totalNetBytes: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly httpService: HttpService,
    private readonly redisClient: Redis,
  ) {}

  @Cron('*/1 * * * *')
  async scrapeAllContainers() {
    try {
      const containers = await this.fetchContainerMetrics();
      for (const container of containers) {
        await this.storeContainerMetrics(container);
      }
    } catch (error) {
      this.logger.error('Failed to scrape container metrics', error.stack);
    }
  }

  private async fetchContainerMetrics(): Promise<ContainerMetric[]> {
    const { data } = await this.httpService.axiosRef.get<ContainerMetric[]>(
      'http://localhost:8080/api/v1.3/subcontainers',
    );
    return data;
  }

  private async storeContainerMetrics(container: ContainerMetric) {
    const containerName =
      container.aliases?.[0]?.replace('/', '') || container.id;
    const latestStats = container.stats.slice(-1)[0];
    if (!latestStats) return;

    await this.redisClient.xadd(
      `metrics:${containerName}`,
      '*',
      'cpu',
      latestStats.cpu.usage.total.toString(),
      'mem',
      latestStats.memory.usage.toString(),
      'rx',
      latestStats.network.interfaces[0]?.rx_bytes?.toString() || '0',
      'tx',
      latestStats.network.interfaces[0]?.tx_bytes?.toString() || '0',
    );
  }

  @Cron('0 0 * * *')
  async aggregateDaily() {
    try {
      const keys = await this.getAllRedisStreamKeys('metrics:*');
      for (const key of keys) {
        await this.aggregateStreamDataToDailyMetric(key);
      }
    } catch (error) {
      this.logger.error('Failed to aggregate daily metrics', error.stack);
    }
  }

  private async getAllRedisStreamKeys(pattern: string): Promise<string[]> {
    let cursor = '0';
    const streamKeys = new Set<string>();
    do {
      const [nextCursor, keys] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      keys.forEach((key) => streamKeys.add(key));
      cursor = nextCursor;
    } while (cursor !== '0');
    return Array.from(streamKeys);
  }

  private async aggregateStreamDataToDailyMetric(streamKey: string) {
    const [, containerName] = streamKey.split(':');
    const entries = await this.redisClient.xrange(streamKey, '-', '+');
    if (entries.length < 2) return;

    const first = this.parseStreamEntry(entries[0]);
    const last = this.parseStreamEntry(entries[entries.length - 1]);

    await this.prisma.dailyMetric.create({
      data: {
        containerName,
        date: new Date().toISOString().split('T')[0],
        cpuSeconds: (last.cpu - first.cpu) / 1e9,
        memoryBytes: last.mem,
        netRxBytes: last.rx - first.rx,
        netTxBytes: last.tx - first.tx,
      },
    });

    await this.redisClient.del(streamKey);
  }

  private parseStreamEntry(entry: [string, string[]]) {
    const [, values] = entry;
    const metric = {} as Record<string, number>;
    for (let i = 0; i < values.length; i += 2) {
      metric[values[i]] = Number(values[i + 1]);
    }
    return metric;
  }

  @Cron('0 0 1 * *')
  async aggregateMonthly() {
    try {
      const { firstDay, lastDay, hoursInMonth } = this.getPreviousMonthRange();

      const aggregates = await this.prisma.dailyMetric.groupBy({
        by: ['containerName'],
        where: {
          date: {
            gte: firstDay.toISOString(),
            lte: lastDay.toISOString(),
          },
        },
        _sum: {
          cpuSeconds: true,
          memoryBytes: true,
          netRxBytes: true,
          netTxBytes: true,
        },
      });

      for (const agg of aggregates) {
        await this.prisma.monthlyAggregate.create({
          data: {
            containerName: agg.containerName,
            periodStart: firstDay,
            periodEnd: lastDay,
            totalCpuSecs: agg._sum.cpuSeconds,
            totalMemGbHrs:
              (Number(agg._sum.memoryBytes) / 1024 ** 3) * hoursInMonth,
            totalNetBytes: Number(agg._sum.netRxBytes + agg._sum.netTxBytes),
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to aggregate monthly metrics', error.stack);
    }
  }

  private getPreviousMonthRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      firstDay,
      lastDay,
      hoursInMonth: lastDay.getDate() * 24,
    };
  }

  @Cron('5 0 1 * *')
  async createInvoicesFromContainerAggregates() {
    const { firstDay, lastDay } = this.getPreviousMonthRange();

    const aggregates = await this.prisma.monthlyAggregate.findMany({
      where: {
        periodStart: { gte: firstDay },
        periodEnd: { lte: lastDay },
      },
    });

    const deployments = await this.prisma.deployment.findMany({
      where: {
        containerName: {
          in: aggregates.map((a) => a.containerName),
        },
      },
      include: {
        project: { select: { linkedByUserId: true } },
      },
    });

    const containerToUserMap = new Map<string, number>();
    deployments.forEach((dep) => {
      if (dep.containerName) {
        containerToUserMap.set(dep.containerName, dep.project.linkedByUserId);
      }
    });

    const userUsage = new Map<
      number,
      Omit<MonthlyAggregate, 'containerName'>
    >();

    for (const agg of aggregates) {
      const userId = containerToUserMap.get(agg.containerName);
      if (!userId) continue;

      const existing = userUsage.get(userId) ?? {
        periodStart: agg.periodStart,
        periodEnd: agg.periodEnd,
        totalCpuSecs: 0,
        totalMemGbHrs: 0,
        totalNetBytes: 0,
      };

      existing.totalCpuSecs += agg.totalCpuSecs;
      existing.totalMemGbHrs += agg.totalMemGbHrs;
      existing.totalNetBytes += Number(agg.totalNetBytes);

      userUsage.set(userId, existing);
    }

    for (const [userId, usage] of userUsage.entries()) {
      await this.prisma.invoice.create({
        data: {
          userId: userId.toString(),
          amount: this.calculateUsageCost(usage),
          status: 'PENDING',
          dueDate: new Date(usage.periodEnd.getTime() + 3 * 86400 * 1000),
        },
      });
    }
    // TODO: Send the notications and payment thigns
  }

  private calculateUsageCost(
    metric: Omit<MonthlyAggregate, 'containerName'>,
  ): number {
    const cpuCost = metric.totalCpuSecs * 0.00002;
    const memoryCost = metric.totalMemGbHrs * 0.0015;
    const networkCost = metric.totalNetBytes * 0.0000001;
    return cpuCost + memoryCost + networkCost;
  }
}
