import { Test, TestingModule } from '@nestjs/testing';
import { PushEventListenerService } from './push-event-listener.service';
import { RepositoryBootstrapService } from '../repository-bootstrap/repository-bootstrap.service';
import { RepositorySyncService } from '../repository-sync/repository-sync.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AlsService } from '../../../../utils/als/als.service';
import { EventNames } from '../../../../core/events/event.module';
import * as path from 'path';

function normalizePath(p: string) {
  return p.replace(/\\/g, '/');
}

describe('PushEventListenerService', () => {
  let service: PushEventListenerService;
  let repositorySyncService: jest.Mocked<RepositorySyncService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let alsService: jest.Mocked<AlsService>;

  const mockPayload = {
    repoData: {
      repository: {
        full_name: 'user/repo',
        clone_url: 'https://github.com/user/repo.git',
        owner: {
          name: 'test-user',
          email: 'test@example.com',
        },
      },
      ref: 'refs/heads/main',
    },
    githubAccessToken: 'ghp_token123',
  };

  beforeEach(async () => {
    // Mock process.env before service instantiation
    process.env.PROJECTS_BASE_PATH = '/base/path';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushEventListenerService,
        {
          provide: RepositoryBootstrapService,
          useValue: { bootstrapRepository: jest.fn() },
        },
        {
          provide: RepositorySyncService,
          useValue: { syncRepository: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: AlsService,
          useValue: { 
            setbranchName: jest.fn(),
            getrepositoryId: jest.fn(),
            getprojectName: jest.fn()
          },
        },
      ],
    }).compile();

    service = module.get<PushEventListenerService>(PushEventListenerService);
    repositorySyncService = module.get(RepositorySyncService);
    eventEmitter = module.get(EventEmitter2);
    alsService = module.get(AlsService);

    jest.clearAllMocks();
  });

  describe('processProject', () => {
    it('should process valid payload, sync repository, and emit SourceCodeReady event', async () => {
      repositorySyncService.syncRepository.mockResolvedValue(undefined);
      const expectedPath = path.join('/base/path', 'user/repo', 'main');

      await service.processProject(mockPayload);

      expect(alsService.setbranchName).toHaveBeenCalledWith('main');
      // Check each argument individually
      const callArgs = repositorySyncService.syncRepository.mock.calls[0];
      expect(normalizePath(callArgs[0])).toBe(normalizePath(expectedPath));
      expect(callArgs[1]).toBe('test-user');
      expect(callArgs[2]).toBe('test@example.com');
      expect(callArgs[3]).toBe('main');
      expect(callArgs[4]).toBe('ghp_token123');
      // Defensive: if event assertion fails, throw with debug info
      try {
        const eventCall = eventEmitter.emit.mock.calls[0][1].projectPath;
        expect(normalizePath(eventCall)).toBe(normalizePath(expectedPath));
      } catch (e) {
        throw new Error('eventEmitter.emit.mock.calls: ' + JSON.stringify(eventEmitter.emit.mock.calls));
      }
    });

    it('should log error and return early for invalid payload', async () => {
      const invalidPayload = {
        repoData: {
          repository: {
            full_name: 'user/repo',
            clone_url: 'https://github.com/user/repo.git',
            owner: {
              name: 'test-user',
              email: 'test@example.com',
            },
          },
          // Missing ref property
        },
        githubAccessToken: 'ghp_token123',
      };

      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await service.processProject(invalidPayload);

      expect(loggerErrorSpy).toHaveBeenCalledWith('Invalid payload: missing repository information.');
      expect(alsService.setbranchName).not.toHaveBeenCalled();
      expect(repositorySyncService.syncRepository).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should log error when repository sync fails', async () => {
      const errorMessage = 'Sync failed';
      repositorySyncService.syncRepository.mockRejectedValue(new Error(errorMessage));
      const expectedPath = path.join('/base/path', 'user/repo', 'main');

      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await service.processProject(mockPayload);

      const actualCall = repositorySyncService.syncRepository.mock.calls[0][0];
      expect(normalizePath(actualCall)).toBe(normalizePath(expectedPath));
      expect(repositorySyncService.syncRepository.mock.calls[0]).toEqual([
        actualCall,
        'test-user',
        'test@example.com',
        'main',
        'ghp_token123',
      ]);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Error processing repository ${mockPayload.repoData.repository.full_name}: ${errorMessage}`,
        expect.any(String),
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});