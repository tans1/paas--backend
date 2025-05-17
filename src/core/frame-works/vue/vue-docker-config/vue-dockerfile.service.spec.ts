import { Test, TestingModule } from '@nestjs/testing';
import { VueDockerfileService } from './vue-dockerfile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('VueDockerfileService', () => {
  let service: VueDockerfileService;
  let eventEmitter: EventEmitter2;
  let writeFileSpy: jest.SpyInstance;
  let readFileSpy: jest.SpyInstance;
  let pathJoinSpy: jest.SpyInstance;

  beforeEach(async () => {
    process.env.DEPLOYMENT_HASH = 'testhash';
    writeFileSpy = jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined);
    readFileSpy = jest.spyOn(require('fs').promises, 'readFile').mockResolvedValue('FROM node:18\n');
    pathJoinSpy = jest.spyOn(require('path'), 'join').mockImplementation((...args: string[]) => args.join('/'));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VueDockerfileService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VueDockerfileService>(VueDockerfileService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should handle errors during Dockerfile creation', async () => {
      const mockConfig = null;
      await expect(service.createDockerfile(mockConfig)).rejects.toThrow();
    });
  });
});