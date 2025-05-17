import { Test, TestingModule } from '@nestjs/testing';
import { RepositoriesController } from './repositories.controller';
import { ConnectService } from './connect/connect.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ListService } from './list/list.service';
import { ProjectService } from '../projects/create-project/project.service';
import { EnvironmentService } from './utils/environment.service';
import { AlsService } from '../../utils/als/als.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OtherException } from '../../utils/exceptions/github.exception';
import { Request, Response } from 'express';
import { DeployDto } from './dto/deploy';
import { AuthenticatedRequest } from '../../utils/types/user.types';

// Mock EventNames to bypass missing src/core/events/event.module
const EventNames = {
  PROJECT_INITIALIZED: 'project.initialized',
};

// Mock dependencies to avoid UsersRepositoryInterface issues
jest.mock('./connect/connect.service', () => ({
  ConnectService: jest.fn().mockImplementation(() => ({
    redirectToGitHubAuth: jest.fn(),
    handleGitHubCallback: jest.fn(),
  })),
}));

jest.mock('./webhooks/webhooks.service', () => ({
  WebhooksService: jest.fn().mockImplementation(() => ({
    createWebhook: jest.fn(),
    handleWebhookEvent: jest.fn(),
  })),
}));

jest.mock('./list/list.service', () => ({
  ListService: jest.fn().mockImplementation(() => ({
    getAllUserRepos: jest.fn(),
    getRepoInfo: jest.fn(),
  })),
}));

jest.mock('../projects/create-project/project.service', () => ({
  ProjectService: jest.fn().mockImplementation(() => ({
    createProject: jest.fn(),
  })),
}));

jest.mock('./utils/environment.service', () => ({
  EnvironmentService: jest.fn().mockImplementation(() => ({
    processEnvironment: jest.fn(),
  })),
}));

jest.mock('../../utils/als/als.service', () => ({
  AlsService: jest.fn().mockImplementation(() => ({
    runWithrepositoryInfo: jest.fn(),
  })),
}));

describe('RepositoriesController', () => {
  let controller: RepositoriesController;
  let connectService: ConnectService;
  let webhooksService: WebhooksService;
  let listService: ListService;
  let projectService: ProjectService;
  let environmentService: EnvironmentService;
  let alsService: AlsService;
  let eventEmitter: EventEmitter2;

  // Mock dependencies
  const mockConnectService = {
    redirectToGitHubAuth: jest.fn(),
    handleGitHubCallback: jest.fn(),
  };

  const mockWebhooksService = {
    createWebhook: jest.fn(),
    handleWebhookEvent: jest.fn(),
  };

  const mockListService = {
    getAllUserRepos: jest.fn(),
    getRepoInfo: jest.fn(),
  };

  const mockProjectService = {
    createProject: jest.fn(),
  };

  const mockEnvironmentService = {
    processEnvironment: jest.fn(),
  };

  const mockAlsService = {
    runWithrepositoryInfo: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  // Mock Request and Response
  const mockRequest = {
    user: { email: 'user@example.com' },
    header: jest.fn<string | string[] | undefined, [string]>(),
    body: {},
  } as unknown as Request;

  const mockResponse = {
    redirect: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepositoriesController],
      providers: [
        {
          provide: ConnectService,
          useValue: mockConnectService,
        },
        {
          provide: WebhooksService,
          useValue: mockWebhooksService,
        },
        {
          provide: ListService,
          useValue: mockListService,
        },
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
        {
          provide: EnvironmentService,
          useValue: mockEnvironmentService,
        },
        {
          provide: AlsService,
          useValue: mockAlsService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    controller = module.get<RepositoriesController>(RepositoriesController);
    connectService = module.get<ConnectService>(ConnectService);
    webhooksService = module.get<WebhooksService>(WebhooksService);
    listService = module.get<ListService>(ListService);
    projectService = module.get<ProjectService>(ProjectService);
    environmentService = module.get<EnvironmentService>(EnvironmentService);
    alsService = module.get<AlsService>(AlsService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('redirectToGitHubAuth', () => {
    it('should redirect to GitHub auth URL', async () => {
      // Arrange
      const githubAuthUrl = 'https://github.com/login/oauth/authorize';
      mockConnectService.redirectToGitHubAuth.mockReturnValue(githubAuthUrl);

      // Act
      await controller.redirectToGitHubAuth(mockResponse);

      // Assert
      expect(connectService.redirectToGitHubAuth).toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(githubAuthUrl);
    });
  });

  describe('handleGitHubCallback', () => {
    it('should handle GitHub callback with valid code', async () => {
      // Arrange
      const code = 'auth-code';
      const callbackResponse = { token: 'github-token' };
      mockConnectService.handleGitHubCallback.mockResolvedValue(callbackResponse);

      // Act
      const result = await controller.handleGitHubCallback(code);

      // Assert
      expect(connectService.handleGitHubCallback).toHaveBeenCalledWith(code);
      expect(result).toEqual(callbackResponse);
    });

    it('should throw OtherException if no code is provided', async () => {
      // Act & Assert
      await expect(controller.handleGitHubCallback(null)).rejects.toThrow(OtherException);
      expect(connectService.handleGitHubCallback).not.toHaveBeenCalled();
    });
  });

  describe('listUserRepositories', () => {
    it('should return list of user repositories', async () => {
      // Arrange
      const email = 'user@example.com';
      const repos = [{ name: 'repo1' }, { name: 'repo2' }];
      mockListService.getAllUserRepos.mockResolvedValue(repos);

      // Act
      const result = await controller.listUserRepositories(mockRequest as any);

      // Assert
      expect(listService.getAllUserRepos).toHaveBeenCalledWith(email);
      expect(result).toEqual(repos);
    });
  });

  describe('getRepoInfo', () => {
    it('should return repository info', async () => {
      // Arrange
      const email = 'user@example.com';
      const owner = 'test-owner';
      const repo = 'test-repo';
      const repoInfo = { data: { name: 'test-repo' } };
      mockListService.getRepoInfo.mockResolvedValue(repoInfo);

      // Act
      const result = await controller.getRepoInfo(mockRequest as any, owner, repo);

      // Assert
      expect(listService.getRepoInfo).toHaveBeenCalledWith(email, owner, repo);
      expect(result).toEqual(repoInfo);
    });
  });

  describe('createWebhook', () => {
    it('should create webhook and project successfully', async () => {
      // Arrange
      const email = 'user@example.com';
      const mockBody = {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main',
        envVars: 'KEY=value\nANOTHER_KEY=another_value',
        githubUsername: 'test-user',
      };
      const mockEnvFile = {} as Express.Multer.File;
      const mockEnvironmentVariables = 'KEY=value\nANOTHER_KEY=another_value';
      const webhookResponse = { message: 'Webhook created successfully' };
      const repoInfo = { data: { id: 123, full_name: 'test-owner/test-repo' } };
      const newProject = { id: 1, name: 'test-project' };
      mockEnvironmentService.processEnvironment.mockResolvedValue(mockEnvironmentVariables);
      mockWebhooksService.createWebhook.mockResolvedValue(webhookResponse);
      mockListService.getRepoInfo.mockResolvedValue(repoInfo);
      mockProjectService.createProject.mockResolvedValue(newProject);
      mockAlsService.runWithrepositoryInfo.mockImplementation((repoId, repoName, fn) => fn());

      // Act
      const result = await controller.createWebhook(mockRequest as any, mockBody, mockEnvFile);

      // Assert
      expect(environmentService.processEnvironment).toHaveBeenCalledWith(mockBody.envVars, mockEnvFile);
      expect(webhooksService.createWebhook).toHaveBeenCalledWith(mockBody.owner, mockBody.repo, email);
      expect(listService.getRepoInfo).toHaveBeenCalledWith(email, mockBody.owner, mockBody.repo);
      expect(projectService.createProject).toHaveBeenCalledWith(repoInfo.data, mockBody.branch, mockEnvironmentVariables);
      expect(alsService.runWithrepositoryInfo).toHaveBeenCalledWith(
        123,
        'test-owner/test-repo',
        expect.any(Function)
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'project.initialized',
        { repository: repoInfo.data, branch: mockBody.branch, email }
      );
      expect(result).toEqual(newProject);
    });

    it('should throw OtherException on error', async () => {
      // Arrange
      const email = 'user@example.com';
      const mockBody = {
        owner: 'test-owner',
        repo: 'test-repo',
        envVars: 'KEY=value\nANOTHER_KEY=another_value',
        githubUsername: 'test-user',
      };
      const errorMessage = 'Webhook creation failed';
      mockEnvironmentService.processEnvironment.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.createWebhook(mockRequest as any, mockBody, undefined)).rejects.toThrow(
        new OtherException(`Failed to create webhook: ${errorMessage}`)
      );
    });
  });
});