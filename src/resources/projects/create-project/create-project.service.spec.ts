import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { ProjectsRepositoryInterface } from '../../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { UsersRepositoryInterface } from '../../../infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepositoryService: ProjectsRepositoryInterface;
  let userService: UsersRepositoryInterface;

  const mockProjectRepository = {
    create: jest.fn(),
    findByRepoAndBranch: jest.fn(),
  };

  const mockUserService = {
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
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectRepositoryService = module.get<ProjectsRepositoryInterface>(ProjectsRepositoryInterface);
    userService = module.get<UsersRepositoryInterface>(UsersRepositoryInterface);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const repository = {
      owner: { login: 'test-user' },
      name: 'test-repo',
      html_url: 'https://github.com/test-user/test-repo',
      id: 123,
    };
    const branch = 'main';
    const environmentVariables = { KEY: 'VALUE' };
    const user = { id: 'user-1', username: 'test-user' };
    const createProjectDto = {
      name: repository.name,
      url: repository.html_url,
      linkedByUserId: user.id,
      repoId: repository.id,
      environmentVariables,
      branch,
    };

    it('should create a project successfully', async () => {
      mockUserService.findOneByUserName.mockResolvedValue(user);
      mockProjectRepository.create.mockResolvedValue({ id: 'project-1', ...createProjectDto });

      const result = await service.createProject(repository, branch, environmentVariables);

      expect(mockUserService.findOneByUserName).toHaveBeenCalledWith('test-user');
      expect(mockProjectRepository.create).toHaveBeenCalledWith(createProjectDto);
      expect(result).toEqual({ id: 'project-1', ...createProjectDto });
    });

    it('should throw HttpException if user is not found', async () => {
      mockUserService.findOneByUserName.mockRejectedValue(new Error('User not found'));

      await expect(
        service.createProject(repository, branch, environmentVariables),
      ).rejects.toThrow(
        new HttpException('User not found', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(mockUserService.findOneByUserName).toHaveBeenCalledWith('test-user');
      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    it('should throw HttpException if project creation fails', async () => {
      mockUserService.findOneByUserName.mockResolvedValue(user);
      mockProjectRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createProject(repository, branch, environmentVariables),
      ).rejects.toThrow(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(mockUserService.findOneByUserName).toHaveBeenCalledWith('test-user');
      expect(mockProjectRepository.create).toHaveBeenCalledWith(createProjectDto);
    });
  });

  describe('findByRepoAndBranch', () => {
    const repoId = 123;
    const branch = 'main';
    const project = { id: 'project-1', repoId, branch, name: 'test-repo' };

    it('should find a project by repoId and branch successfully', async () => {
      mockProjectRepository.findByRepoAndBranch.mockResolvedValue(project);

      const result = await service.findByRepoAndBranch(repoId, branch);

      expect(mockProjectRepository.findByRepoAndBranch).toHaveBeenCalledWith(repoId, branch);
      expect(result).toEqual(project);
    });

    it('should throw HttpException if finding project fails', async () => {
      mockProjectRepository.findByRepoAndBranch.mockRejectedValue(new Error('Project not found'));

      await expect(service.findByRepoAndBranch(repoId, branch)).rejects.toThrow(
        new HttpException('Project not found', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(mockProjectRepository.findByRepoAndBranch).toHaveBeenCalledWith(repoId, branch);
    });
  });
});