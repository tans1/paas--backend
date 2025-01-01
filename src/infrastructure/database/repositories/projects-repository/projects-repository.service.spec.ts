import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsRepositoryService } from './projects-repository.service';

describe('ProjectsRepositoryService', () => {
  let service: ProjectsRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsRepositoryService],
    }).compile();

    service = module.get<ProjectsRepositoryService>(ProjectsRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
