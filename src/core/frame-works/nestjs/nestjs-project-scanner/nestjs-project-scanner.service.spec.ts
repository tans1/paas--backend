import { Test, TestingModule } from '@nestjs/testing';
import { NestJsProjectScannerService } from './nestjs-project-scanner.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('NestJsProjectScannerService', () => {
  let service: NestJsProjectScannerService;
  let eventEmitter: EventEmitter2;
  let writeFileSpy: jest.SpyInstance;
  let readFileSpy: jest.SpyInstance;
  let pathJoinSpy: jest.SpyInstance;

  beforeEach(async () => {
    writeFileSpy = jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined);
    readFileSpy = jest.spyOn(require('fs').promises, 'readFile').mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('package.json')) {
        return JSON.stringify({ dependencies: { express: '^4.0.0' }, devDependencies: { jest: '^29.0.0' } });
      }
      throw new Error('File not found');
    });
    pathJoinSpy = jest.spyOn(require('path'), 'join').mockImplementation((...args: string[]) => args.join('/'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestJsProjectScannerService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NestJsProjectScannerService>(NestJsProjectScannerService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scan', () => {
    it('should scan project and return configuration', async () => {
      const mockProjectPath = '/test/project/path';
      const result = await service.scan({ projectPath: mockProjectPath, configFile: 'package.json' });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('projectPath');
      expect(result).toHaveProperty('nodeVersion');
    });

    it('should handle errors during scanning', async () => {
      const mockProjectPath = '/invalid/path';
      await expect(service.scan({ projectPath: mockProjectPath })).rejects.toThrow();
    });
  });
});