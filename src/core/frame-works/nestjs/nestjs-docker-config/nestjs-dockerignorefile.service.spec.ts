import { Test, TestingModule } from '@nestjs/testing';
import { NestJsDockerIgnoreFileService } from './nestjs-dockerignorefile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('NestJsDockerIgnoreFileService', () => {
  let service: NestJsDockerIgnoreFileService;
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
        NestJsDockerIgnoreFileService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NestJsDockerIgnoreFileService>(NestJsDockerIgnoreFileService);
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
      writeFileSpy.mockRejectedValueOnce(new Error('Failed to write'));
      const mockConfig = { projectPath: '/test/project/path' };
      await expect(service.addDockerIgnoreFile(mockConfig)).rejects.toThrow();
    });
  });
});