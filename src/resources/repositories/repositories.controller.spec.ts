import { Test, TestingModule } from '@nestjs/testing';
import { RepositoriesController } from './repositories.controller';
import { ConnectService } from './connect/connect.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ListService } from './list/list.service';
import { ProjectService } from './project/create-project/project.service';
import { UsersService } from '../users/users.service';
import { OtherException } from '@/utils/exceptions/github.exception';
import { AuthenticatedRequest } from '../../utils/types/user.types';
import { DeployDto } from './dto/deploy';
import { Response, Request } from 'express';

describe('RepositoriesController', () => {
  let controller: RepositoriesController;
  let connectService: ConnectService;
  let webhooksService: WebhooksService;
  let listService: ListService;
  let projectService: ProjectService;
  let usersService: UsersService;

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
          },
        },
        {
          provide: ProjectService,
          useValue: {
            createProject: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<RepositoriesController>(RepositoriesController);
    connectService = module.get<ConnectService>(ConnectService);
    webhooksService = module.get<WebhooksService>(WebhooksService);
    listService = module.get<ListService>(ListService);
    projectService = module.get<ProjectService>(ProjectService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('redirectToGitHubAuth', () => {
    it('should redirect to GitHub Auth', async () => {
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      const redirectUri = 'https://github.com/login/oauth/authorize';
      jest.spyOn(connectService, 'redirectToGitHubAuth').mockReturnValue(redirectUri);

      await controller.redirectToGitHubAuth(res);

      expect(res.redirect).toHaveBeenCalledWith(redirectUri);
    });
  });

  describe('handleGitHubCallback', () => {
    it('should throw OtherException if no code is provided', async () => {
      await expect(controller.handleGitHubCallback(null)).rejects.toThrow(OtherException);
    });

    it('should handle GitHub callback', async () => {
      const code = 'valid_code';
      const handleGitHubCallbackResult = { message: 'Successfully connected to GitHub', data: { githubUsername: 'mockuser' } };
      jest.spyOn(connectService, 'handleGitHubCallback').mockResolvedValue(handleGitHubCallbackResult);

      const result = await controller.handleGitHubCallback(code);

      expect(result).toEqual(handleGitHubCallbackResult);
      expect(connectService.handleGitHubCallback).toHaveBeenCalledWith(code);
    });
  });

  describe('listUserRepositories', () => {
    it('should list user repositories', async () => {
      const req = {
        user: { email: 'test@example.com' },
      } as AuthenticatedRequest;
      const repos = { message: 'User repositories fetched successfully', data: [{ name: 'repo1' }, { name: 'repo2' }] };
      jest.spyOn(listService, 'getAllUserRepos').mockResolvedValue(repos);

      const result = await controller.listUserRepositories(req);

      expect(result).toEqual(repos);
      expect(listService.getAllUserRepos).toHaveBeenCalledWith(req.user.email);
    });
  });

  describe('getRepoInfo', () => {
    it('should get repository info', async () => {
      const req = {
        user: { email: 'test@example.com' },
      } as AuthenticatedRequest;
      const owner = 'owner';
      const repo = 'repo';
      const repoInfo = { message: 'Repository info fetched successfully', data: { name: 'repo', owner: 'owner' } };
      jest.spyOn(listService, 'getRepoInfo').mockResolvedValue(repoInfo);

      const result = await controller.getRepoInfo(req, owner, repo);

      expect(result).toEqual(repoInfo);
      expect(listService.getRepoInfo).toHaveBeenCalledWith(req.user.email, owner, repo);
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const req = {
        user: { email: 'test@example.com' },
      } as AuthenticatedRequest;
      const body: DeployDto = { owner: 'owner', repo: 'repo', githubUsername: 'mockuser' };
      const webhookResult = { message: 'Webhook created successfully' };
      jest.spyOn(webhooksService, 'createWebhook').mockResolvedValue(webhookResult);

      const result = await controller.createWebhook(req, body);

      expect(result).toEqual(webhookResult);
      expect(webhooksService.createWebhook).toHaveBeenCalledWith(body.owner, body.repo, req.user.email);
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle webhook event', async () => {
      const req = {
        header: jest.fn().mockImplementation((name: string) => {
          if (name === 'x-hub-signature-256') return 'signature';
          if (name === 'X-GitHub-Event') return 'push';
          return null;
        }),
        body: { action: 'push' },
      } as unknown as Request;
      jest.spyOn(webhooksService, 'handleWebhookEvent').mockImplementation();

      await controller.handleWebhookEvent(req);

      expect(webhooksService.handleWebhookEvent).toHaveBeenCalledWith('signature', 'push', req.body);
    });

    it('should handle ping event', async () => {
      const req = {
        header: jest.fn().mockImplementation((name: string) => {
          if (name === 'x-hub-signature-256') return 'signature';
          if (name === 'X-GitHub-Event') return 'ping';
          return null;
        }),
        body: { action: 'ping' },
      } as unknown as Request;
      jest.spyOn(projectService, 'createProject').mockImplementation();

      await controller.handleWebhookEvent(req);

      expect(projectService.createProject).toHaveBeenCalledWith(req.body);
    });

    it('should throw OtherException if missing headers or payload', async () => {
      const req = {
        header: jest.fn().mockReturnValue(null),
        body: null,
      } as unknown as Request;

      await expect(controller.handleWebhookEvent(req)).rejects.toThrow(OtherException);
    });
  });
});