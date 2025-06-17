import { Test, TestingModule } from '@nestjs/testing';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { InvalidDataException } from '../../../utils/exceptions/github.exception';
import { OctokitService } from '../../../utils/octokit/octokit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '../../../core/events/event.module';
import { AlsService } from '../../../utils/als/als.service';
import { ProjectService } from '../../../resources/projects/create-project/project.service';
import { ListService } from '../list/list.service';
import { WebhooksService } from './webhooks.service';
import { ProjectStatus } from '@prisma/client';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let octokitService: OctokitService;
  let eventEmitter: EventEmitter2;
  let alsService: AlsService;
  let projectService: ProjectService;
  let listService: ListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: OctokitService,
          useValue: {
            getOctokit: jest.fn(),
          },
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
            initContext: jest.fn(),
            setRepositoryId: jest.fn(),
            setProjectName: jest.fn(),
            setLastCommitMessage: jest.fn(),
            setExtension: jest.fn(),
          },
        },
        {
          provide: ProjectService,
          useValue: {
            findByRepoAndBranch: jest.fn(),
            updateProject: jest.fn(),
          },
        },
        {
          provide: ListService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    octokitService = module.get<OctokitService>(OctokitService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    alsService = module.get<AlsService>(AlsService);
    projectService = module.get<ProjectService>(ProjectService);
    listService = module.get<ListService>(ListService);
  });

  describe('createWebhook', () => {
    it('should create webhook successfully', async () => {
      const mockOctokit = {
        repos: {
          listWebhooks: jest.fn().mockResolvedValue({ data: [] }),
          createWebhook: jest.fn().mockResolvedValue({ data: {} }),
        },
      };

      jest.spyOn(octokitService, 'getOctokit').mockResolvedValue(mockOctokit);

      const result = await service.createWebhook('owner', 'repo', 'email');
      expect(result).toEqual({ message: 'Webhook created successfully' });
    });

    it('should handle existing webhook', async () => {
      const mockOctokit = {
        repos: {
          listWebhooks: jest.fn().mockResolvedValue({
            data: [{ config: { url: process.env.DEP_WEBHOOK_URL } }],
          }),
          createWebhook: jest.fn(),
        },
      };

      jest.spyOn(octokitService, 'getOctokit').mockResolvedValue(mockOctokit);

      const result = await service.createWebhook('owner', 'repo', 'email');
      expect(result).toEqual({ message: 'Webhook already exists' });
    });

    it('should handle webhook creation error', async () => {
      const mockOctokit = {
        repos: {
          listWebhooks: jest.fn().mockResolvedValue({ data: [] }),
          createWebhook: jest.fn().mockRejectedValue({
            status: 422,
            response: { data: { message: 'already exists' } },
          }),
        },
      };

      jest.spyOn(octokitService, 'getOctokit').mockResolvedValue(mockOctokit);

      const result = await service.createWebhook('owner', 'repo', 'email');
      expect(result).toEqual({ message: 'Webhook already exists' });
    });

    it('should throw exception for other errors', async () => {
      const mockOctokit = {
        repos: {
          listWebhooks: jest.fn().mockResolvedValue({ data: [] }),
          createWebhook: jest.fn().mockRejectedValue(new Error('Test error')),
        },
      };

      jest.spyOn(octokitService, 'getOctokit').mockResolvedValue(mockOctokit);

      await expect(service.createWebhook('owner', 'repo', 'email')).rejects.toThrow(
        InvalidDataException,
      );
    });
  });

  describe('handleWebhookEvent', () => {
    it('should validate webhook signature successfully', () => {
      const payload = { test: 'data' };
      const signature = 'sha256=' + createHmac('sha256', 'secret')
        .update(JSON.stringify(payload))
        .digest('hex');
      
      expect(() => service.handleWebhookEvent(signature, 'push', payload)).not.toThrow();
    });

    it('should throw exception for invalid signature', () => {
      const payload = { test: 'data' };
      const invalidSignature = 'invalid-signature';
      
      expect(() => service.handleWebhookEvent(invalidSignature, 'push', payload)).toThrow(
        InvalidDataException,
      );
    });

    it('should handle webhook event for registered repository', async () => {
      const mockProject = {
              id: 1, 
              name: 'test-project',
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
              PORT: 8081,
              deployments: { id: 1, 
                branch: 'main', 
                createdAt: new Date(), 
                environmentVariables: { 'foo': 'bar' }, 
                lastCommitMessage: 'last commit', 
                status: ProjectStatus.RUNNING, 
                projectId: 2, 
                rollbackToId: 1, 
                containerName: 'my project', 
                imageName: 'my-image', 
                extension: '213', 
              }, 
              linkedByUser: 1
            };
      const mockPayload = {
        repository: { id: 1, full_name: 'repo/name' },
        ref: 'refs/heads/main',
        head_commit: { message: 'Initial commit' },
      };

      jest.spyOn(projectService, 'findByRepoAndBranch').mockResolvedValue(mockProject);
      jest.spyOn(projectService, 'updateProject').mockResolvedValue(undefined);
      jest.spyOn(alsService, 'initContext').mockResolvedValue(NEVER);
      jest.spyOn(alsService, 'setRepositoryId').mockResolvedValue(undefined);
      jest.spyOn(alsService, 'setProjectName').mockResolvedValue(undefined);
      jest.spyOn(alsService, 'setLastCommitMessage').mockResolvedValue(undefined);
      jest.spyOn(alsService, 'setExtension').mockResolvedValue(undefined);
      jest.spyOn(eventEmitter, 'emit').mockResolvedValue(undefined);
      let signature ='new CryptoKey().usages.toString()'
      await service.handleWebhookEvent(signature,'push', mockPayload);
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventNames.PushEventReceived, {
        repoData: mockPayload,
        githubAccessToken: 123,
      });
    });

    it('should handle webhook event for unregistered repository', async () => {
      const mockPayload = {
        repository: { id: 1, full_name: 'repo/name' },
        ref: 'refs/heads/main',
        head_commit: { message: 'Initial commit' },
      };

      jest.spyOn(projectService, 'findByRepoAndBranch').mockResolvedValue(null);

      await service.handleWebhookEvent('signature', 'push', mockPayload);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});