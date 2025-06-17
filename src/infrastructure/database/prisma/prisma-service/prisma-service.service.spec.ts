import { PrismaService } from './prisma-service.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
    // Prevent real database connection
    jest.spyOn(service, '$connect').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('calls $connect once', async () => {
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalledTimes(1);
    });
  });
});
