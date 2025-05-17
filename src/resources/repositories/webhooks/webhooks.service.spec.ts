import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { OctokitService } from '../octokit/octokit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AlsService } from '../../../utils/als/als.service';
import { ProjectService } from '../../../resources/projects/create-project/project.service';
import { InvalidDataException } from '../../../utils/exceptions/github.exception';
import { createHmac } from 'node:crypto';

// Mock OctokitService to avoid UsersService dependency
jest.mock('../octokit/octokit.service', () => ({
  OctokitService: jest.fn().mockImplementation(() => ({
    getOctokit: jest.fn(),
  })),
}));

// Mock EventNames to bypass missing src/core/events/event.module
jest.mock('../../../core/events/event.module', () => ({
  EventNames: {
    PushEventReceived: 'push.event.received',
  },
}));

describe('WebhooksService', () => {
  let service: WebhooksService;
  let octokitService: OctokitService;
  let eventEmitter: EventEmitter2;
  let alsService: AlsService;
  let projectService: ProjectService;

  // Mock dependencies
  const mockOctokitService = {
    getOctokit: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockAlsService = {
    runWithrepositoryInfo: jest.fn(),
  };

  const mockProjectService = {
    findByRepoAndBranch: jest.fn(),
  };

  // Mock Octokit instance
  const mockOctokit = {
    repos: {
      listWebhooks: jest.fn(),
      createWebhook: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: OctokitService,
          useValue: mockOctokitService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: AlsService,
          useValue: mockAlsService,
        },
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    octokitService = module.get<OctokitService>(OctokitService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    alsService = module.get<AlsService>(AlsService);
    projectService = module.get<ProjectService>(ProjectService);

    // Set up environment variables
    process.env.DEP_WEBHOOK_URL = 'https://example.com/webhook';
    process.env.DEP_WEBHOOK_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('createWebhook', () => {
    it('should create a webhook successfully if it does not exist', async () => {
      // Arrange
      const owner = 'test-owner';
      const repo = 'test-repo';
      const email = 'user@example.com';
      mockOctokitService.getOctokit.mockResolvedValue(mockOctokit);
      mockOctokit.repos.listWebhooks.mockResolvedValue({ data: [] });
      mockOctokit.repos.createWebhook.mockResolvedValue({});

      // Act
      const result = await service.createWebhook(owner, repo, email);

      // Assert
      expect(octokitService.getOctokit).toHaveBeenCalledWith(email);
      expect(mockOctokit.repos.listWebhooks).toHaveBeenCalledWith({ owner, repo });
      expect(mockOctokit.repos.createWebhook).toHaveBeenCalledWith({
        owner,
        repo,
        config: {
          url: process.env.DEP_WEBHOOK_URL,
          secret: process.env.DEP_WEBHOOK_SECRET,
          content_type: 'json',
        },
        events: ['push'],
        active: true,
      });
      expect(result).toEqual({ message: 'Webhook created successfully' });
    });

    it('should return "Webhook already exists" if webhook exists', async () => {
      // Arrange
      const owner = 'test-owner';
      const repo = 'test-repo';
      const email = 'user@example.com';
      mockOctokitService.getOctokit.mockResolvedValue(mockOctokit);
      mockOctokit.repos.listWebhooks.mockResolvedValue({
        data: [{ config: { url: process.env.DEP_WEBHOOK_URL } }],
      });

      // Act
      const result = await service.createWebhook(owner, repo, email);

      // Assert
      expect(octokitService.getOctokit).toHaveBeenCalledWith(email);
      expect(mockOctokit.repos.listWebhooks).toHaveBeenCalledWith({ owner, repo });
      expect(mockOctokit.repos.createWebhook).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Webhook already exists' });
    });

    it('should handle 422 error indicating webhook already exists', async () => {
      // Arrange
      const owner = 'test-owner';
      const repo = 'test-repo';
      const email = 'user@example.com';
      mockOctokitService.getOctokit.mockResolvedValue(mockOctokit);
      mockOctokit.repos.listWebhooks.mockResolvedValue({ data: [] });
      mockOctokit.repos.createWebhook.mockRejectedValue({
        status: 422,
        response: { data: { message: 'Hook already exists' } },
      });

      // Act
      const result = await service.createWebhook(owner, repo, email);

      // Assert
      expect(octokitService.getOctokit).toHaveBeenCalledWith(email);
      expect(mockOctokit.repos.listWebhooks).toHaveBeenCalledWith({ owner, repo });
      expect(mockOctokit.repos.createWebhook).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Webhook already exists' });
    });

    it('should throw InvalidDataException for other errors', async () => {
      // Arrange
      const owner = 'test-owner';
      const repo = 'test-repo';
      const email = 'user@example.com';
      const errorMessage = 'API error';
      mockOctokitService.getOctokit.mockResolvedValue(mockOctokit);
      mockOctokit.repos.listWebhooks.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.createWebhook(owner, repo, email)).rejects.toThrow(
        new InvalidDataException(`Failed to create webhook: ${errorMessage}`)
      );
      expect(octokitService.getOctokit).toHaveBeenCalledWith(email);
      expect(mockOctokit.repos.listWebhooks).toHaveBeenCalledWith({ owner, repo });
      expect(mockOctokit.repos.createWebhook).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhookEvent', () => {
    it('should process webhook event and emit PushEventReceived if signatures match and project exists', async () => {
      // Arrange
      const payload = {
        repository: { id: 123, full_name: 'owner/repo' },
        ref: 'refs/heads/main',
      };
      const event = 'push';
      const secret = process.env.DEP_WEBHOOK_SECRET;
      const hmac = createHmac('sha256', secret);
      const signature = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
      const mockProject = {
        linkedByUser: { githubAccessToken: 'ghp_testToken123' },
      };
      mockProjectService.findByRepoAndBranch.mockResolvedValue(mockProject);
      mockAlsService.runWithrepositoryInfo.mockImplementation((repoId, repoName, fn) => fn());

      // Act
      await service.handleWebhookEvent(signature, event, payload);

      // Assert
      expect(mockProjectService.findByRepoAndBranch).toHaveBeenCalledWith(123, 'main');
      expect(mockAlsService.runWithrepositoryInfo).toHaveBeenCalledWith(
        123,
        'owner/repo',
        expect.any(Function)
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'push.event.received',
        {
          repoData: payload,
          githubAccessToken: 'ghp_testToken123',
        }
      );
    });

    it('should throw InvalidDataException if signatures do not match', async () => {
      // Arrange
      const payload = {
        repository: { id: 123, full_name: 'owner/repo' },
        ref: 'refs/heads/main',
      };
      const event = 'push';
      const signature = 'sha256=invalid-signature';

      // Act & Assert
      await expect(service.handleWebhookEvent(signature, event, payload)).rejects.toThrow(
        new InvalidDataException('Signatures did not match!')
      );
      expect(mockProjectService.findByRepoAndBranch).not.toHaveBeenCalled();
      expect(mockAlsService.runWithrepositoryInfo).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should return without action if project is not found', async () => {
      // Arrange
      const payload = {
        repository: { id: 123, full_name: 'owner/repo' },
        ref: 'refs/heads/main',
      };
      const event = 'push';
      const secret = process.env.DEP_WEBHOOK_SECRET;
      const hmac = createHmac('sha256', secret);
      const signature = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
      mockProjectService.findByRepoAndBranch.mockResolvedValue(null);

      // Act
      await service.handleWebhookEvent(signature, event, payload);

      // Assert
      expect(mockProjectService.findByRepoAndBranch).toHaveBeenCalledWith(123, 'main');
      expect(mockAlsService.runWithrepositoryInfo).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should handle webhook event with missing repository data', async () => {
      // Arrange
      const payload = {
        ref: 'refs/heads/main',
      };
      const event = 'push';
      const secret = process.env.DEP_WEBHOOK_SECRET;
      const hmac = createHmac('sha256', secret);
      const signature = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

      // Act
      await service.handleWebhookEvent(signature, event, payload);

      // Assert
      expect(mockProjectService.findByRepoAndBranch).toHaveBeenCalledWith(undefined, 'main');
      expect(mockAlsService.runWithrepositoryInfo).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should handle webhook event with missing ref data', async () => {
      // Arrange
      const payload = {
        repository: { id: 123, full_name: 'owner/repo' },
      };
      const event = 'push';
      const secret = process.env.DEP_WEBHOOK_SECRET;
      const hmac = createHmac('sha256', secret);
      const signature = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

      // Act
      await service.handleWebhookEvent(signature, event, payload);

      // Assert
      expect(mockProjectService.findByRepoAndBranch).toHaveBeenCalledWith(123, '');
      expect(mockAlsService.runWithrepositoryInfo).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});