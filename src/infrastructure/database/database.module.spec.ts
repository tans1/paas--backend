import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { PrismaService } from './prisma/prisma-service/prisma-service.service';

describe('DatabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });
}); 