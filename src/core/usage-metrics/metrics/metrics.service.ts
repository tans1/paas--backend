import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import {
  ContainerMetric,
  MonthlyAggregate,
  UsedResourceMetrics,
} from '../types';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly httpService: HttpService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    this.redisClient.on('connect', () => this.logger.log('Redis connected'));

    this.redisClient.on('error', (err) =>
      this.logger.error('Redis error', err),
    );

    this.redisClient.on('ready', () => this.logger.log('Redis ready'));

    this.redisClient.on('end', () =>
      this.logger.log('Redis connection closed'),
    );
  }

  // @Cron('0 */10 * * * *') // every 10min on production
  @Cron('0 */1 * * * *') // every 1min on dev
  async scrapeAllContainersMetrics() {
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
    if (!container.aliases) return;
    const containerName = container.aliases[0] || container.id;
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

  // @Cron('0 0 0 * * *') // runs once every day on production
  @Cron('0 */3 * * * *') // every 3min on dev
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
        date: new Date(new Date().toISOString()),
        cpuSeconds: (last.cpu - first.cpu) / 1e9,
        memoryBytes: last.mem,
        netRxBytes: last.rx - first.rx,
        netTxBytes: last.tx - first.tx,
      },
    });

    const userId = await this.getUserIdByContainerName(containerName);
    if (!userId) return;
    console.log('in the metrics+++++++', userId);
    const currPayment = await this.prisma.payment.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    const mostRecentInvoice = await this.prisma.invoice.findFirst({
      where: { userId, status: 'PAID' },
      orderBy: { updatedAt: 'desc' },
    });

    const todaysAmount = this.calculateUsageCost({
      totalCpuSecs: (last.cpu - first.cpu) / 1e9,
      totalMemGbHrs: last.mem,
      totalNetBytes: last.rx - first.rx + last.tx - first.tx,
    });

    if (currPayment) {
      await this.prisma.payment.update({
        where: { id: currPayment.id },
        data: {
          amount: todaysAmount + currPayment.amount,
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          userId,
          amount: todaysAmount,
          status: 'PENDING',
          recentPaidAmount: mostRecentInvoice ? mostRecentInvoice.amount : 0.0,
        },
      });
    }
    await this.redisClient.del(streamKey);
  }

  // @Cron('0 0 0 1 * *') // At second 0, minute 0, hour 0, on day 1 of every month: on the production
  @Cron('0 */10 * * * *') // every 10min on dev
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
  // @Cron('0 10 0 1 * *') // At second 0, minute 10, hour 0, on day 1 of every month, shortly after the monthly aggregation on production
  @Cron('0 */11 * * * *') // every 11min on dev
  async createInvoicesFromContainerAggregates() {
    const { firstDay, lastDay } = this.getPreviousMonthRange();
    const aggregates = await this.prisma.monthlyAggregate.findMany({
      where: {
        periodStart: { gte: new Date(firstDay.getTime() - 5 * 60 * 1000) },
        periodEnd: { lte: new Date(lastDay.getTime() + 5 * 60 * 1000) },
      },
    });

    const userUsage = new Map<
      number,
      Omit<MonthlyAggregate, 'containerName'>
    >();

    for (const agg of aggregates) {
      const userId = await this.getUserIdByContainerName(agg.containerName);
      if (userId === null) continue;

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
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: {
          userId,
          status: {
            in: ['PENDING', 'GENERATED'],
          },
        },
      });

      const amount = this.calculateUsageCost(usage);
      const dueDate = new Date(usage.periodEnd.getTime() + 3 * 86400 * 1000);

      if (existingInvoice) {
        await this.prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            amount,
            // dueDate,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.invoice.create({
          data: {
            userId,
            amount,
            status: 'PENDING',
            dueDate,
          },
        });
      }
    }
  }

  private calculateUsageCost(metric: UsedResourceMetrics): number {
    const cpuCost = metric.totalCpuSecs * 2;
    const memoryCost = metric.totalMemGbHrs * 1;
    const networkCost = metric.totalNetBytes * 5;
    return cpuCost + memoryCost + networkCost;
  }

  private async getUserIdByContainerName(
    containerName: string,
  ): Promise<number | null> {
    const deployment = await this.prisma.deployment.findFirst({
      where: { containerName },
      select: { project: { select: { linkedByUserId: true } } },
    });

    return deployment?.project.linkedByUserId ?? null;
  }

  private parseStreamEntry(entry: [string, string[]]) {
    const [, values] = entry;
    const metric = {} as Record<string, number>;
    for (let i = 0; i < values.length; i += 2) {
      metric[values[i]] = Number(values[i + 1]);
    }
    return metric;
  }

  // private getPreviousMonthRange() {
  //   const now = new Date();
  //   const firstDay = new Date(
  //     Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  //   );
  //   const lastDay = new Date(
  //     Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0),
  //   );
  //   return {
  //     firstDay,
  //     lastDay,
  //     hoursInMonth: lastDay.getDate() * 24,
  //   };
  // }

  private getPreviousMonthRange() {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    return {
      firstDay: new Date(tenMinutesAgo.toISOString()),
      lastDay: new Date(now.toISOString()),
      hoursInMonth: 30 / 60,
    };
  }
}
