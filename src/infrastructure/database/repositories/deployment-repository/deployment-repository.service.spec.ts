import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentRepositoryService } from './deployment-repository.service';

describe('DeploymentRepositoryService', () => {
  let service: DeploymentRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeploymentRepositoryService],
    }).compile();

    service = module.get<DeploymentRepositoryService>(
      DeploymentRepositoryService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
