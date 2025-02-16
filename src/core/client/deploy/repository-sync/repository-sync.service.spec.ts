import { Test, TestingModule } from '@nestjs/testing';
import { RepositorySyncService } from './repository-sync.service';

describe('RepositorySyncService', () => {
  let service: RepositorySyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepositorySyncService],
    }).compile();

    service = module.get<RepositorySyncService>(RepositorySyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
