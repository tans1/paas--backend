import { Test, TestingModule } from '@nestjs/testing';
import { AngularDockerIgnoreFileService } from './angular-dockerignorefile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AngularDockerIgnoreFileService', () => {
  let service: AngularDockerIgnoreFileService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AngularDockerIgnoreFileService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AngularDockerIgnoreFileService>(AngularDockerIgnoreFileService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addDockerIgnoreFile', () => {
    it('should create .dockerignore file with correct configuration', async () => {
      const mockConfig = {
        projectPath: '/test/project/path',
        nodeVersion: '18',
        defaultBuildLocation: 'dist',
      };

      await service.addDockerIgnoreFile(mockConfig);
      expect(require('fs').promises.writeFile).toHaveBeenCalled();
    });

    it('should handle errors during .dockerignore creation', async () => {
      const mockConfig = null;
      await expect(service.addDockerIgnoreFile(mockConfig)).rejects.toThrow();
    });
  });
});