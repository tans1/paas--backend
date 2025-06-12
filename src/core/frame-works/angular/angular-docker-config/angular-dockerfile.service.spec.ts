import { Test, TestingModule } from '@nestjs/testing';
import { AngularDockerfileService } from './angular-dockerfile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';

describe('AngularDockerfileService', () => {
  let service: AngularDockerfileService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    jest.spyOn(fs.promises, 'readFile').mockImplementation(async (filePath: any, encoding: any) => {
      if (typeof filePath === 'string' && filePath.includes('angular.json')) {
        return JSON.stringify({
          projects: {
            app: {
              architect: {
                build: {
                  options: {},
                  configurations: { production: {} },
                },
              },
            },
          },
        });
      }
      if (typeof filePath === 'string' && filePath.includes('package.json')) {
        return JSON.stringify({
          dependencies: { '@angular/core': '17.0.0' },
          devDependencies: {},
        });
      }
      if (typeof filePath === 'string' && filePath.includes('tsconfig.json')) {
        return JSON.stringify({ compilerOptions: { module: 'commonjs' } });
      }
      if (typeof filePath === 'string' && filePath.includes('Dockerfile')) {
        return '';
      }
      return '';
    });
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AngularDockerfileService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AngularDockerfileService>(AngularDockerfileService);
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
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });

    it('should handle errors during Dockerfile creation', async () => {
      const mockConfig = null;
      await expect(service.createDockerfile(mockConfig)).rejects.toThrow();
    });
  });
});