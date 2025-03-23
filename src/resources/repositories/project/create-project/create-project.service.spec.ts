import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { ProjectsRepositoryInterface, CreateProjectDTO } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { UsersRepositoryInterface } from '@/infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepository: ProjectsRepositoryInterface;
  let userRepository: UsersRepositoryInterface;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: ProjectsRepositoryInterface,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: UsersRepositoryInterface,
          useValue: {
            findOneByUserName: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectRepository = module.get<ProjectsRepositoryInterface>(ProjectsRepositoryInterface);
    userRepository = module.get<UsersRepositoryInterface>(UsersRepositoryInterface);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const payload = {
        repository: {
          owner: { login: 'testuser' },
          name: 'testrepo',
          html_url: 'http://testrepo.com',
          id: 1,
        },
      };
      const user = { id: 1, username: 'testuser' };
      const createProjectDto: CreateProjectDTO = {
        name: 'testrepo',
        url: 'http://testrepo.com',
        linkedByUserId: 1,
        repoId: 1,
      };
      const createdProject = { id: 1, ...createProjectDto };

      jest.spyOn(userRepository, 'findOneByUserName').mockResolvedValue(user);
      jest.spyOn(projectRepository, 'create').mockResolvedValue(createdProject);

      const result = await service.createProject(payload);

      expect(result).toEqual(createdProject);
      expect(userRepository.findOneByUserName).toHaveBeenCalledWith('testuser');
      expect(projectRepository.create).toHaveBeenCalledWith(createProjectDto);
    });

    it('should handle errors when creating a project', async () => {
      const payload = {
        repository: {
          owner: { login: 'testuser' },
          name: 'testrepo',
          html_url: 'http://testrepo.com',
          id: 1,
        },
      };
      const errorMessage = 'Error creating project';

      jest.spyOn(userRepository, 'findOneByUserName').mockRejectedValue(new Error(errorMessage));

      await expect(service.createProject(payload)).rejects.toThrow(HttpException);
      await expect(service.createProject(payload)).rejects.toThrow(errorMessage);

      try {
        await service.createProject(payload);
      } catch (error) {
        expect(error.message).toBe(errorMessage);
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });
});