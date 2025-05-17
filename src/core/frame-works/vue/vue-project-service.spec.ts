import { Test, TestingModule } from '@nestjs/testing';
import { VueProjectService } from './vue-project-service';
import { VueProjectScannerService } from './vue-project-scanner/vue-project-scanner.service';
import { VueDockerfileService } from './vue-docker-config/vue-dockerfile.service';
import { VueDockerIgnoreFileService } from './vue-docker-config/vue-dockerignorefile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '../../events/event.module';
import { FrameworkMap } from '../../framework-detector/framework.config';

describe('VueProjectService', () => {
  let service: VueProjectService;
  let vueProjectScannerService: jest.Mocked<VueProjectScannerService>;
  let vueDockerfileService: jest.Mocked<VueDockerfileService>;
  let vueDockerIgnoreFileService: jest.Mocked<VueDockerIgnoreFileService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VueProjectService,
        {
          provide: VueProjectScannerService,
          useValue: {
            scan: jest.fn(),
          },
        },
        {
          provide: VueDockerfileService,
          useValue: {
            createDockerfile: jest.fn(),
          },
        },
        {
          provide: VueDockerIgnoreFileService,
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

    service = module.get<VueProjectService>(VueProjectService);
    vueProjectScannerService = module.get(VueProjectScannerService);
    vueDockerfileService = module.get(VueDockerfileService);
    vueDockerIgnoreFileService = module.get(VueDockerIgnoreFileService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processVueProject', () => {
    it('should process Vue project successfully', async () => {
      const payload = {
        projectPath: '/test/path',
      };
      const mockConfig = {
        projectPath: '/test/path',
        nodeVersion: '16',
        defaultBuildLocation: 'dist',
      };

      vueProjectScannerService.scan.mockResolvedValue(mockConfig);
      vueDockerfileService.createDockerfile.mockResolvedValue(undefined);
      vueDockerIgnoreFileService.addDockerIgnoreFile.mockResolvedValue(undefined);

      await service.processVueProject(payload);

      expect(vueProjectScannerService.scan).toHaveBeenCalledWith(payload);
      expect(vueDockerfileService.createDockerfile).toHaveBeenCalledWith(mockConfig);
      expect(vueDockerIgnoreFileService.addDockerIgnoreFile).toHaveBeenCalledWith(mockConfig);
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventNames.SourceCodeReady, {
        projectPath: payload.projectPath,
      });
    });

    it('should handle errors during project processing', async () => {
      const payload = {
        projectPath: '/test/path',
      };

      vueProjectScannerService.scan.mockRejectedValue(new Error('Scan failed'));

      await expect(service.processVueProject(payload)).rejects.toThrow();
    });
  });
}); 