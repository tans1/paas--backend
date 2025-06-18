import { MetricsService } from './metrics.service';
import { HttpService } from '@nestjs/axios';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';

describe('MetricsService', () => {
  let service: MetricsService;
  let httpService: Partial<HttpService>;
  let redisClient: Partial<Redis>;
  let prisma: Partial<PrismaClient>;

  beforeEach(() => {
    httpService = {
      axiosRef: { get: jest.fn() },
    };
    redisClient = {
      on: jest.fn(),
      xadd: jest.fn(),
      scan: jest.fn(),
      xrange: jest.fn(),
      del: jest.fn(),
    } as any;
    prisma = {
      dailyMetric: { create: jest.fn() },
      deployment: { findFirst: jest.fn() },
    } as any;

    // inject
    service = new MetricsService(
      httpService as HttpService,
      redisClient as Redis,
    );
    // override prisma instance
    (service as any).prisma = prisma as PrismaClient;

    // set env prices
    process.env.PRICE_PER_CPU_SECOND = '0.1';
    process.env.PRICE_PER_MEM_SECOND = '0.2';
    process.env.PRICE_PER_NET_SECOND = '0.3';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchContainerMetrics', () => {
    it('returns data from httpService', async () => {
      const data = [{ id: 'c1', aliases: ['a1'], stats: [] }];
      (httpService.axiosRef.get as jest.Mock).mockResolvedValue({ data });
      const result = await (service as any).fetchContainerMetrics();
      expect(httpService.axiosRef.get).toHaveBeenCalledWith(process.env.C_ADVISOR_URL);
      expect(result).toBe(data);
    });
  });

  describe('storeContainerMetrics', () => {
    it('skips container without aliases', async () => {
      // Note: omit aliases entirely so container.aliases is undefined
      const container: any = {
        id: 'c1',
        stats: [
          {
            cpu: { usage: { total: 10 } },
            memory: { usage: 20 },
            network: { interfaces: [{ rx_bytes: 5, tx_bytes: 3 }] },
          },
        ],
      };

      await (service as any).storeContainerMetrics(container);

      expect(redisClient.xadd).not.toHaveBeenCalled();
    });
    it('adds stream entry for latest stats', async () => {
      const c = {
        id: 'c1',
        aliases: ['name1'],
        stats: [
          { cpu: { usage: { total: 10 } }, memory: { usage: 20 }, network: { interfaces: [{ rx_bytes: 5, tx_bytes: 3 }] } },
          { cpu: { usage: { total: 30 } }, memory: { usage: 40 }, network: { interfaces: [{ rx_bytes: 15, tx_bytes: 13 }] } },
        ],
      };
      await (service as any).storeContainerMetrics(c);
      expect(redisClient.xadd).toHaveBeenCalledWith(
        'metrics:name1',
        '*',
        'cpu', '30',
        'mem', '40',
        'rx', '15',
        'tx', '13',
      );
    });
  });

  describe('scrapeAllContainersMetrics', () => {
    it('invokes fetch and store for each container', async () => {
      const spyFetch = jest.spyOn<any, any>(service, 'fetchContainerMetrics').mockResolvedValue([{ id: 'x', aliases: ['a'], stats: [] }]);
      const spyStore = jest.spyOn<any, any>(service, 'storeContainerMetrics').mockResolvedValue(undefined);
      await service.scrapeAllContainersMetrics();
      expect(spyFetch).toHaveBeenCalled();
      expect(spyStore).toHaveBeenCalledWith({ id: 'x', aliases: ['a'], stats: [] });
    });
  });

  describe('aggregateDaily', () => {
    it('creates dailyMetric and deletes stream', async () => {
      // simulate one stream key
      (redisClient.scan as jest.Mock).mockResolvedValueOnce(['0', ['metrics:foo']]).mockResolvedValueOnce(['0', []]);
      // one entry first, one last
      (redisClient.xrange as jest.Mock).mockResolvedValue([
        ['1', ['cpu','100','mem','200','rx','10','tx','5']],
        ['2', ['cpu','300','mem','400','rx','30','tx','15']],
      ]);
      // map containerName -> userId
      (prisma.deployment!.findFirst as jest.Mock).mockResolvedValue({ project: { linkedByUserId: 7 } });

      await service.aggregateDaily();

      // expected cost calculation:
      // cpuSecs = (300-100)/1e9 = 2e-7; mem = 400; net = (30-10)+(15-5)=30
      const expectedCost =
        (2e-7 * 0.1) + (400 * 0.2) + (30 * 0.3);

      expect(prisma.dailyMetric!.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 7,
          containerName: 'foo',
          amount: expectedCost,
          cpuSeconds: (300 - 100) / 1e9,
          memoryBytes: 400,
          netRxBytes: 20,
          netTxBytes: 10,
        }),
      });
      expect(redisClient.del).toHaveBeenCalledWith('metrics:foo');
    });

    it('skips when less than two entries', async () => {
      (redisClient.scan as jest.Mock).mockResolvedValueOnce(['0', ['metrics:foo']]).mockResolvedValueOnce(['0', []]);
      (redisClient.xrange as jest.Mock).mockResolvedValue([['1', ['cpu','1']]]);

      await service.aggregateDaily();
      expect(prisma.dailyMetric!.create).not.toHaveBeenCalled();
    });
  });
});
