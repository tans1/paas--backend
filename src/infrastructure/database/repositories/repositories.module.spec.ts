import { Test, TestingModule } from '@nestjs/testing';
import { RepositoriesModule } from './repositories.module';
import { PrismaService } from '../prisma/prisma-service/prisma-service.service';

describe('RepositoriesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RepositoriesModule],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            user: {},
            server: {},
            project: {},
            deployment: {},
            admin: {},
            auth: {},
          },
        },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
}); 