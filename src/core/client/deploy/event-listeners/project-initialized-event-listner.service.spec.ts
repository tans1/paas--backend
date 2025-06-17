import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { EventNames } from '../../../events/event.module';
import { RepositoryBootstrapService } from '../repository-bootstrap/repository-bootstrap.service';
import { RepositorySyncService } from '../repository-sync/repository-sync.service';
import { AlsService } from '../../../../utils/als/als.service';
import { UsersService } from '../../../../resources/users/users.service';
import { EnvironmentService } from '@/utils/environment/environment.service';
import { ProjectInitializedEventListenerService } from './project-initialized-event-listner.service';
import path from 'path';

describe('ProjectInitializedEventListenerService', () => {
  let service: ProjectInitializedEventListenerService;
  let repositoryBootstrapService: RepositoryBootstrapService;
  let eventEmitter: EventEmitter2;
  let alsService: AlsService;
  let userService: UsersService;
  let environmentService: EnvironmentService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectInitializedEventListenerService,
        {
          provide: RepositoryBootstrapService,
          useValue: {
            bootstrapRepository: jest.fn(),
          },
        },
        {
          provide: RepositorySyncService,
          useValue: {},
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: AlsService,
          useValue: {
            setbranchName: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: EnvironmentService,
          useValue: {
            addEnvironmentFile: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
            fatal: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectInitializedEventListenerService>(ProjectInitializedEventListenerService);
    repositoryBootstrapService = module.get<RepositoryBootstrapService>(RepositoryBootstrapService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    alsService = module.get<AlsService>(AlsService);
    userService = module.get<UsersService>(UsersService);
    environmentService = module.get<EnvironmentService>(EnvironmentService);
    logger = module.get<Logger>(Logger);
  });

  describe('processProject', () => {
    const mockPayload = {
      repository: {
        full_name: 'test/repo',
        clone_url: 'https://github.com/test/repo.git',
      },
      branch: 'main',
      email: 'test@example.com',
      environmentVariables: { 'foo': 'bar' },
    };

    it('should handle missing user', async () => {
      jest.spyOn(userService, 'findOneBy').mockResolvedValue(null);

      console.log("alsiefhgaisgfhigasdfjgslzf: ", await service.processProject(mockPayload))
      await service.processProject(mockPayload);
      expect(logger.error).toHaveBeenCalledWith(
        'User not found for email: test@example.com'
      );
    });

    it('should handle invalid payload', async () => {
      const invalidPayload = {
        repository: null,
        branch: 'main',
        email: 'test@example.com',
        environmentVariables: {},
      };

      await service.processProject(invalidPayload);
      expect(logger.error).toHaveBeenCalledWith(
        'Invalid payload: missing repository information.'
      );
    });

    it('should process project successfully', async () => {
      jest.spyOn(userService, 'findOneBy').mockResolvedValue({
        githubAccessToken: 'mock-token',
      });
      jest.spyOn(repositoryBootstrapService, 'bootstrapRepository').mockResolvedValue(undefined);
      jest.spyOn(environmentService, 'addEnvironmentFile').mockResolvedValue(undefined);

      await service.processProject(mockPayload);

      expect(alsService.setbranchName).toHaveBeenCalledWith('main');
      expect(repositoryBootstrapService.bootstrapRepository).toHaveBeenCalledWith(
        'https://github.com/test/repo.git',
        path.join(process.cwd(), 'projects', 'test/repo', 'main'),
        'main',
        'mock-token'
      );
      expect(environmentService.addEnvironmentFile).toHaveBeenCalledWith({
        environmentVariables: {},
        projectPath: path.join(process.cwd(), 'projects', 'test/repo', 'main'),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventNames.PROJECT_UPLOADED, {
        projectPath: path.join(process.cwd(), 'projects', 'test/repo', 'main'),
      });
    });

    it('should handle bootstrap error', async () => {
      jest.spyOn(userService, 'findOneBy').mockResolvedValue({
        githubAccessToken: 'mock-token',
      });
      jest.spyOn(repositoryBootstrapService, 'bootstrapRepository').mockRejectedValue(
        new Error('Clone failed')
      );

      await service.processProject(mockPayload);

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing repository test/repo: Clone failed',
        expect.any(String)
      );
    });
  });
});