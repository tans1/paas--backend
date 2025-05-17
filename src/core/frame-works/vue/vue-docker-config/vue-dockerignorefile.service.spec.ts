import { Test, TestingModule } from '@nestjs/testing';
import { VueDockerIgnoreFileService } from './vue-dockerignorefile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('VueDockerIgnoreFileService', () => {
  let service: VueDockerIgnoreFileService;
  let eventEmitter: EventEmitter2;
  let writeFileSpy: jest.SpyInstance;
  let readFileSpy: jest.SpyInstance;
  let pathJoinSpy: jest.SpyInstance;

  beforeEach(async () => {
    writeFileSpy = jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined);
    readFileSpy = jest.spyOn(require('fs').promises, 'readFile').mockResolvedValue('node_modules\ndist\n.env\n');
    pathJoinSpy = jest.spyOn(require('path'), 'join').mockImplementation((...args: string[]) => args.join('/'));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VueDockerIgnoreFileService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VueDockerIgnoreFileService>(VueDockerIgnoreFileService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should handle errors during .dockerignore creation', async () => {
      const mockConfig = null;
      await expect(service.addDockerIgnoreFile(mockConfig)).rejects.toThrow();
    });
  });
});