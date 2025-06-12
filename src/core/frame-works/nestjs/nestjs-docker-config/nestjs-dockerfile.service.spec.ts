import { Test, TestingModule } from '@nestjs/testing';
import { NestJsDockerfileService } from './nestjs-dockerfile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('NestJsDockerfileService', () => {
  let service: NestJsDockerfileService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestJsDockerfileService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NestJsDockerfileService>(NestJsDockerfileService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDockerfile', () => {
    it('should create Dockerfile with correct configuration', async () => {
      const mockConfig = {
        projectPath: '/test/project/path',
        nodeVersion: '18',
        defaultBuildLocation: 'dist',
      };

      await service.createDockerfile(mockConfig);
      expect(require('fs').promises.writeFile).toHaveBeenCalled();
    });

    it('should handle errors during Dockerfile creation', async () => {
      const mockConfig = null;
      await expect(service.createDockerfile(mockConfig)).rejects.toThrow();
    });
  });
});