import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomApiResponse } from '@/utils/api-responses/api-response';
import { AuthenticatedRequest } from '../../utils/types/user.types';
import { DeployDto } from './dto/deploy';
import { EventNames } from '../../core/events/event.module';
import { FrameworkDetectionService } from '@/core/framework-detector/framework-detection-service/framework-detection.service';
import { EventEmitter } from 'events';
import { RepositoriesController } from './repositories.controller';
import { AlsService } from '@/utils/als/als.service';
import { EnvironmentService } from '@/utils/environment/environment.service';
import { ProjectService } from '../projects/create-project/project.service';
import { ConnectService } from './connect/connect.service';
import { ListService } from './list/list.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ProjectStatus } from '@prisma/client';

describe('RepositoriesController', () => {
  let controller: RepositoriesController;
  let connectService: ConnectService;
  let webHookService: WebhooksService;
  let listService: ListService;
  let projectService: ProjectService;
  let environmentService: EnvironmentService;
  let alsService: AlsService;
  let eventEmitter: EventEmitter2;
  let frameworkDetectionService: FrameworkDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepositoriesController],
      providers: [
        {
          provide: ConnectService,
          useValue: {
            redirectToGitHubAuth: jest.fn(),
            handleGitHubCallback: jest.fn(),
          },
        },
        {
          provide: WebhooksService,
          useValue: {
            createWebhook: jest.fn(),
            handleWebhookEvent: jest.fn(),
          },
        },
        {
          provide: ListService,
          useValue: {
            getAllUserRepos: jest.fn(),
            getRepoInfo: jest.fn(),
            getLastCommitMessage: jest.fn(),
          },
        },
        {
          provide: ProjectService,
          useValue: {
            createProject: jest.fn(),
            findOne: jest.fn(),
            getDeployment: jest.fn(),
          },
        },
        {
          provide: EnvironmentService,
          useValue: {
            processEnvironment: jest.fn(),
          },
        },
        {
          provide: AlsService,
          useValue: {
            initContext: jest.fn(),
            setRepositoryId: jest.fn(),
            setProjectName: jest.fn(),
            setframework: jest.fn(),
            setExtension: jest.fn(),
            runWithrepositoryInfo: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: FrameworkDetectionService,
          useValue: {
            detectFramework: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RepositoriesController>(RepositoriesController);
    connectService = module.get<ConnectService>(ConnectService);
    webHookService = module.get<WebhooksService>(WebhooksService);
    listService = module.get<ListService>(ListService);
    projectService = module.get<ProjectService>(ProjectService);
    environmentService = module.get<EnvironmentService>(EnvironmentService);
    alsService = module.get<AlsService>(AlsService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    frameworkDetectionService = module.get<FrameworkDetectionService>(FrameworkDetectionService);
  });

  describe('redirectToGitHubAuth', () => {
    it('should redirect to GitHub auth URL', async () => {
      const mockUser = { email: 'test@example.com' };
      const mockReq = { user: mockUser } as AuthenticatedRequest;
      const mockUrl = 'https://github.com/login/oauth/authorize?client_id=test';

      jest.spyOn(connectService, 'redirectToGitHubAuth').mockReturnValue(mockUrl);

      const result = await controller.redirectToGitHubAuth(mockReq);
      expect(result).toEqual({ url: mockUrl });
    });
  });

  describe('listUserRepositories', () => {
    it('should return user repositories', async () => {
      const mockRepos = { message: 'test-repo', data: [] };
      const mockReq = { user: { email: 'test@example.com' } } as AuthenticatedRequest;

      jest.spyOn(listService, 'getAllUserRepos').mockResolvedValue(mockRepos);

      const result = await controller.listUserRepositories(mockReq);
      expect(result).toEqual(mockRepos);
    });
  });

  describe('getRepoInfo', () => {
    it('should return repository information', async () => {
      const mockRepo = { message: 'test-repo', data: [] };
      const mockReq = { user: { email: 'test@example.com' } } as AuthenticatedRequest;

      jest.spyOn(listService, 'getRepoInfo').mockResolvedValue(mockRepo);

      const result = await controller.getRepoInfo(mockReq, 'owner', 'repo');
      expect(result).toEqual(mockRepo);
    });
  });

  describe('createWebhook', () => {
    it('should create webhook and return project', async () => {
      const mockReq = { user: { email: 'test@example.com' } } as AuthenticatedRequest;
      const mockFile = { buffer: Buffer.from('env=content') } as Express.Multer.File;
      const mockBody: DeployDto = {
        owner: 'owner',
        repo: 'repo',
        githubUsername: 'username',
        envVars: 'foo=bar',
        framework: 'framework',
        installCommand: 'install',
        buildCommand: 'build',
        runCommand: 'run',
        outputDirectory: 'output',
        rootDirectory: 'root',
        projectDescription: 'description',
      };

      const mockWebhookResponse = { message: 'test-repo', data: [] };;
      const mockRepoInfo = { message: 'test-repo', data: { id: 1, default_branch: 'main' } };
      const mockProject = {
        id: 1, name: 'test-project',
        repository: 'test-repo',
        branch: 'main',
        environmentVariables: { 'foo': 'bar' },
        lastCommitMessage: 'test commit',
        owner: 'owner',
        repo: 'repo',
        githubUsername: 'username',
        envVars: 'foo=bar',
        framework: 'framework',
        installCommand: 'install',
        buildCommand: 'build',
        runCommand: 'run',
        outputDirectory: 'output',
        rootDirectory: 'root',
        projectDescription: 'description',
        repoId: 1,
        url: 'string',
        linkedByUserId: 1,
        createdAt: new Date(),
        deployedIp: '123',
        deployedPort: 8080,
        deployedUrl: 'url',
        activeDeploymentId: 1,

        localRepoPath: 'path/to/repo',
        zoneId: '1',
        aRecordId: '1',
        cnameRecordId: '1',

        status: ProjectStatus.RUNNING,
        dockerComposeFile: 'string',
        PORT: 8081
      };

      jest.spyOn(webHookService, 'createWebhook').mockResolvedValue(mockWebhookResponse);
      jest.spyOn(listService, 'getRepoInfo').mockResolvedValue(mockRepoInfo);
      jest.spyOn(listService, 'getLastCommitMessage').mockResolvedValue({ message: 'Initial commit', data: [] });
      jest.spyOn(projectService, 'createProject').mockResolvedValue(mockProject);
      jest.spyOn(environmentService, 'processEnvironment').mockResolvedValue({});

      const result = await controller.createWebhook(mockReq, mockBody, mockFile);
      expect(result).toEqual(CustomApiResponse.success(mockProject, 'succefuuly created project'));
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle webhook event', async () => {
      const mockReq = {
        header: () => 'signature',
        body: { action: 'created' },
      } as unknown as Request;

      const result = await controller.handleWebhookEvent(mockReq);
      expect(result).toBeUndefined();
    });

    it('should handle ping event', async () => {
      const mockReq = {
        header: () => 'signature',
        body: {},
      } as unknown as Request;

      jest.spyOn(mockReq, 'header').mockImplementation((header) => {
        if (header === 'X-GitHub-Event') return 'ping';
        return 'signature';
      });

      const result = await controller.handleWebhookEvent(mockReq);
      expect(result).toBeUndefined();
    });
  });

  describe('detectFramework', () => {
    it('should detect framework', async () => {
      const mockReq = { user: { email: 'test@example.com' } } as AuthenticatedRequest;
      const mockFrameworks = ['react'];

      jest.spyOn(frameworkDetectionService, 'detectFramework').mockResolvedValue(mockFrameworks);

      const result = await controller.detectFramework(mockReq, 'owner', 'repo');
      expect(result).toEqual(CustomApiResponse.success(mockFrameworks[0], '1 framework(s) detected'));
    });
  });
});