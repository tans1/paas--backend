import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { ProjectsRepositoryInterface } from '../../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { UsersRepositoryInterface } from '../../../infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepository: jest.Mocked<ProjectsRepositoryInterface>;
  let userRepository: jest.Mocked<UsersRepositoryInterface>;

  const mockProjectRepository = {
    create: jest.fn(),
    findByRepoAndBranch: jest.fn(),
  };

  const mockUserRepository = {
    findOneByUserName: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: ProjectsRepositoryInterface,
          useValue: mockProjectRepository,
        },
        {
          provide: UsersRepositoryInterface,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectRepository = module.get(ProjectsRepositoryInterface);
    userRepository = module.get(UsersRepositoryInterface);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const mockRepository = {
      owner: { login: 'testuser' },
      name: 'test-repo',
      html_url: 'https://github.com/testuser/test-repo',
      id: 123,
    };
    const mockBranch = 'main';
    const mockEnvVars = { KEY: 'value' };
    const mockUser = { 
      id: 1, 
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'user',
      githubUsername: 'testuser',
      githubAccessToken: 'github-token',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should successfully create a project', async () => {
      userRepository.findOneByUserName.mockResolvedValue(mockUser);
      projectRepository.create.mockResolvedValue({
        id: 1,
        name: mockRepository.name,
        url: mockRepository.html_url,
        linkedByUserId: mockUser.id,
        repoId: mockRepository.id,
        environmentVariables: mockEnvVars,
        branch: mockBranch,
        createdAt: new Date(),
        deployedIp: '127.0.0.1',
        deployedPort: 3000,
        deployedUrl: 'http://localhost:3000',
        localRepoPath: '/path/to/repo',
        zoneId: 'zone-123',
        aRecordId: 'a-123',
        cnameRecordId: 'cname-123',
      });

      const result = await service.createProject(mockRepository, mockBranch, mockEnvVars);

      expect(userRepository.findOneByUserName).toHaveBeenCalledWith(mockRepository.owner.login);
      expect(projectRepository.create).toHaveBeenCalledWith({
        name: mockRepository.name,
        url: mockRepository.html_url,
        linkedByUserId: mockUser.id,
        repoId: mockRepository.id,
        environmentVariables: mockEnvVars,
        branch: mockBranch,
      });
      expect(result).toBeDefined();
      expect(result.repoId).toBe(mockRepository.id);
    });

    it('should throw HttpException when user is not found', async () => {
      userRepository.findOneByUserName.mockResolvedValue(null);

      await expect(service.createProject(mockRepository, mockBranch, mockEnvVars))
        .rejects
        .toThrow(new HttpException('User not found', HttpStatus.INTERNAL_SERVER_ERROR));
    });

    it('should throw HttpException when project creation fails', async () => {
      userRepository.findOneByUserName.mockResolvedValue(mockUser);
      projectRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createProject(mockRepository, mockBranch, mockEnvVars))
        .rejects
        .toThrow(new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR));
    });
  });

  describe('findByRepoAndBranch', () => {
    const mockRepoId = 123;
    const mockBranch = 'main';
    const mockProject = {
      id: 1,
      name: 'test-repo',
      repoId: mockRepoId,
      branch: mockBranch,
      deployments: [{
        id: 1,
        branch: mockBranch,
        createdAt: new Date(),
        environmentVariables: { KEY: 'value' },
        status: 'active',
        projectId: 1,
        rollbackToId: 0,
        containerName: 'test-container',
        imageName: 'test-image'
      }],
      linkedByUser: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        githubUsername: 'testuser',
        githubAccessToken: 'github-token',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      url: 'https://github.com/testuser/test-repo',
      linkedByUserId: 1,
      createdAt: new Date(),
      environmentVariables: { KEY: 'value' },
      deployedIp: '127.0.0.1',
      deployedPort: 3000,
      deployedUrl: 'http://localhost:3000',
      localRepoPath: '/path/to/repo',
      zoneId: 'zone-123',
      aRecordId: 'a-123',
      cnameRecordId: 'cname-123',
    };

    it('should successfully find project by repo and branch', async () => {
      projectRepository.findByRepoAndBranch.mockResolvedValue(mockProject);

      const result = await service.findByRepoAndBranch(mockRepoId, mockBranch);

      expect(projectRepository.findByRepoAndBranch).toHaveBeenCalledWith(mockRepoId, mockBranch);
      expect(result).toEqual(mockProject);
    });

    it('should throw HttpException when finding project fails', async () => {
      projectRepository.findByRepoAndBranch.mockRejectedValue(new Error('Database error'));

      await expect(service.findByRepoAndBranch(mockRepoId, mockBranch))
        .rejects
        .toThrow(new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR));
    });
  });
}); 