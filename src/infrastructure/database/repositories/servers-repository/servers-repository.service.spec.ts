import { Test, TestingModule } from '@nestjs/testing';
import { ServersRepositoryService } from './servers-repository.service';

describe('ServersRepositoryService', () => {
  let service: ServersRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServersRepositoryService],
    }).compile();

    service = module.get<ServersRepositoryService>(ServersRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
