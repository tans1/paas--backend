import { Test, TestingModule } from '@nestjs/testing';
import { GithubRepositoryService } from './github-repository.service';

describe('GithubRepositoryService', () => {
  let service: GithubRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubRepositoryService],
    }).compile();

    service = module.get<GithubRepositoryService>(GithubRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
