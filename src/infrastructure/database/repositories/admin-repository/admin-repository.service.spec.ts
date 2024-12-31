import { Test, TestingModule } from '@nestjs/testing';
import { AdminRepositoryService } from './admin-repository.service';

describe('AdminRepositoryService', () => {
  let service: AdminRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminRepositoryService],
    }).compile();

    service = module.get<AdminRepositoryService>(AdminRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
