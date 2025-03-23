import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepository: ProjectsRepositoryInterface;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepositoryInterface,
          useValue: {
            findByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectsRepository = module.get<ProjectsRepositoryInterface>(ProjectsRepositoryInterface);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProjects', () => {
    it('should return an array of projects', async () => {
      const userId = 1;
      const mockProjects = [
        { id: 1, name: 'Project 1', repoId: 1, url: 'http://project1.com', linkedByUserId: userId },
        { id: 2, name: 'Project 2', repoId: 2, url: 'http://project2.com', linkedByUserId: userId },
      ];
      jest.spyOn(projectsRepository, 'findByUserId').mockResolvedValueOnce(mockProjects);

      const result = await service.getProjects(userId);
      expect(result).toEqual(mockProjects);
      expect(projectsRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });
});