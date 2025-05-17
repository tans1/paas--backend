import { Test, TestingModule } from '@nestjs/testing';
import { AngularProjectScannerService } from './angular-project-scanner.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AngularProjectScannerService', () => {
  let service: AngularProjectScannerService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    jest.spyOn(require('fs').promises, 'readFile').mockImplementation(async (filePath: any, encoding: any) => {
      if (typeof filePath === 'string' && filePath.includes('package.json')) {
        return JSON.stringify({
          dependencies: { '@angular/core': '^17.0.0' },
          devDependencies: { jest: '^29.0.0' },
          engines: { node: '18' },
        });
      }
      if (typeof filePath === 'string' && filePath.includes('angular.json')) {
        return JSON.stringify({
          defaultProject: 'app',
          projects: {
            app: {
              architect: {
                build: {
                  options: { outputPath: 'dist' },
                },
              },
            },
          },
        });
      }
      throw new Error('ENOENT');
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AngularProjectScannerService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AngularProjectScannerService>(AngularProjectScannerService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
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
      await expect(service.scan({ projectPath: mockProjectPath })).rejects.toThrow();
    });
  });
});