import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { ProjectsRepositoryInterface, ProjectWithDeploymentsAndUser } from '../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { Project } from '@prisma/client';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockProjectsRepository: jest.Mocked<ProjectsRepositoryInterface>;

  const mockProject: Project = {
    id: 1,
    name: 'Test Project',
    repoId: 123,
    branch: 'main',
    url: 'https://github.com/test/repo',
    linkedByUserId: 1,
    createdAt: new Date(),
    environmentVariables: {},
    deployedIp: '',
    deployedPort: 0,
    deployedUrl: '',
    localRepoPath: '',
    zoneId: '',
    aRecordId: '',
    cnameRecordId: '',
  };

  const mockProjectWithRelations: ProjectWithDeploymentsAndUser = {
    ...mockProject,
    deployments: [],
    linkedByUser: {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      password: 'hashed_password',
      role: 'user',
      githubUsername: 'testuser',
      githubAccessToken: 'github_token',
    },
  };

  beforeEach(async () => {
    mockProjectsRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByRepoAndBranch: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      addDeployment: jest.fn(),
      getAllDeployments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepositoryInterface,
          useValue: mockProjectsRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProjects', () => {
    it('should return projects for a given user ID', async () => {
      const userId = 1;
      const expectedProjects = [mockProject];

      mockProjectsRepository.findByUserId.mockResolvedValue(expectedProjects);

      const result = await service.getProjects(userId);

      expect(mockProjectsRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedProjects);
    });

    it('should handle empty results', async () => {
      const userId = 999;
      mockProjectsRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getProjects(userId);

      expect(mockProjectsRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });

  describe('getProject', () => {
    it('should return a project for given repo ID and branch', async () => {
      const repoId = 123;
      const branch = 'main';

      mockProjectsRepository.findByRepoAndBranch.mockResolvedValue(mockProjectWithRelations);

      const result = await service.getProject(repoId, branch);

      expect(mockProjectsRepository.findByRepoAndBranch).toHaveBeenCalledWith(repoId, branch);
      expect(result).toEqual(mockProjectWithRelations);
    });

    it('should handle non-existent project', async () => {
      const repoId = 999;
      const branch = 'main';
      mockProjectsRepository.findByRepoAndBranch.mockResolvedValue(null);

      const result = await service.getProject(repoId, branch);

      expect(mockProjectsRepository.findByRepoAndBranch).toHaveBeenCalledWith(repoId, branch);
      expect(result).toBeNull();
    });

    it('should handle string repoId by converting to number', async () => {
      const repoId = '123';
      const branch = 'main';

      mockProjectsRepository.findByRepoAndBranch.mockResolvedValue(mockProjectWithRelations);

      const result = await service.getProject(repoId as any, branch);

      expect(mockProjectsRepository.findByRepoAndBranch).toHaveBeenCalledWith(123, branch);
      expect(result).toEqual(mockProjectWithRelations);
    });
  });
});