import { Test, TestingModule } from '@nestjs/testing';
import { ReactProjectScannerService } from './react-project-scanner.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ReactProjectScannerService', () => {
  let service: ReactProjectScannerService;
  let eventEmitter: EventEmitter2;
  let readFileSpy: jest.SpyInstance;
  let pathJoinSpy: jest.SpyInstance;

  beforeEach(async () => {
    readFileSpy = jest.spyOn(require('fs').promises, 'readFile').mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('package.json')) {
        return JSON.stringify({ dependencies: { react: '^18.0.0' }, devDependencies: { jest: '^29.0.0' } });
      }
      throw new Error('File not found');
    });
    pathJoinSpy = jest.spyOn(require('path'), 'join').mockImplementation((...args: string[]) => args.join('/'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactProjectScannerService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReactProjectScannerService>(ReactProjectScannerService);
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
      expect(result).toHaveProperty('dependencies');
      expect(result).toHaveProperty('devDependencies');
    });

    it('should handle errors during scanning', async () => {
      const mockProjectPath = '/invalid/path';
      await expect(service.scan({ projectPath: mockProjectPath, configFile: 'package.json' })).rejects.toThrow();
    });
  });
});