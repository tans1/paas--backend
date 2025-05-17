import { Test, TestingModule } from '@nestjs/testing';
import { NestJsProjectService } from './nestjs-project-service';
import { NestJsProjectScannerService } from './nestjs-project-scanner/nestjs-project-scanner.service';
import { NestJsDockerfileService } from './nestjs-docker-config/nestjs-dockerfile.service';
import { NestJsDockerIgnoreFileService } from './nestjs-docker-config/nestjs-dockerignorefile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '../../events/event.module';
import { FrameworkMap } from '../../framework-detector/framework.config';

interface ProjectPayload {
  projectPath: string;
  configFile: string;
}

interface ProjectConfig {
  projectPath: string;
  nodeVersion: string;
  defaultBuildLocation?: string;
}

describe('NestJsProjectService', () => {
  let service: NestJsProjectService;
  let nestJsProjectScannerService: jest.Mocked<NestJsProjectScannerService>;
  let nestJsDockerfileService: jest.Mocked<NestJsDockerfileService>;
  let nestJsDocerIgnoreFileService: jest.Mocked<NestJsDockerIgnoreFileService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestJsProjectService,
        {
          provide: NestJsProjectScannerService,
          useValue: {
            scan: jest.fn(),
          },
        },
        {
          provide: NestJsDockerfileService,
          useValue: {
            createDockerfile: jest.fn(),
          },
        },
        {
          provide: NestJsDockerIgnoreFileService,
          useValue: {
            addDockerIgnoreFile: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NestJsProjectService>(NestJsProjectService);
    nestJsProjectScannerService = module.get(NestJsProjectScannerService);
    nestJsDockerfileService = module.get(NestJsDockerfileService);
    nestJsDocerIgnoreFileService = module.get(NestJsDockerIgnoreFileService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processVueProject', () => {
    it('should process NestJS project successfully', async () => {
      const payload: ProjectPayload = {
        projectPath: '/test/path',
        configFile: 'package.json',
      };
      const mockConfig: ProjectConfig = {
        projectPath: '/test/path',
        nodeVersion: '16.0.0',
        defaultBuildLocation: 'dist',
      };

      nestJsProjectScannerService.scan.mockResolvedValue(mockConfig);
      nestJsDockerfileService.createDockerfile.mockResolvedValue(undefined);
      nestJsDocerIgnoreFileService.addDockerIgnoreFile.mockResolvedValue(undefined);

      await service.processVueProject(payload);

      expect(nestJsProjectScannerService.scan).toHaveBeenCalledWith(payload);
      expect(nestJsDockerfileService.createDockerfile).toHaveBeenCalledWith(mockConfig);
      expect(nestJsDocerIgnoreFileService.addDockerIgnoreFile).toHaveBeenCalledWith(mockConfig);
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventNames.SourceCodeReady, {
        projectPath: payload.projectPath,
      });
    });

    it('should handle errors during project processing', async () => {
      const payload: ProjectPayload = {
        projectPath: '/test/path',
        configFile: 'package.json',
      };

      nestJsProjectScannerService.scan.mockRejectedValue(new Error('Scan failed'));

      await expect(service.processVueProject(payload)).rejects.toThrow();
    });
  });
}); 