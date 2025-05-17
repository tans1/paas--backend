import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryBootstrapService } from './repository-bootstrap.service';

describe('RepositoryBootstrapService', () => {
  let service: RepositoryBootstrapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepositoryBootstrapService],
    }).compile();

    service = module.get<RepositoryBootstrapService>(
      RepositoryBootstrapService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
