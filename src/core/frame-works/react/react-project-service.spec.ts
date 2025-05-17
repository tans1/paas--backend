import { Test, TestingModule } from '@nestjs/testing';
import { ReactProjectService } from './react-project-service';
import { ReactProjectScannerService } from './react-project-scanner/react-project-scanner.service';
import { ReactDockerfileService } from './react-docker-config/react-dockerfile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReactDockerIgnoreFileService } from './react-docker-config/react-dockerignorefile.service';
import { EventNames } from '../../events/event.module';
import { FrameworkMap } from '../../framework-detector/framework.config';

describe('ReactProjectService', () => {
  let service: ReactProjectService;
  let scannerService: ReactProjectScannerService;
  let dockerfileService: ReactDockerfileService;
  let eventEmitter: EventEmitter2;
  let dockerIgnoreService: ReactDockerIgnoreFileService;

  const mockProjectPath = '/test/project/path';
  const mockProjectConfig = {
    dependencies: ['react', 'react-dom'],
    devDependencies: ['@types/react'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactProjectService,
        {
          provide: ReactProjectScannerService,
          useValue: {
            scan: jest.fn().mockResolvedValue(mockProjectConfig),
          },
        },
        {
          provide: ReactDockerfileService,
          useValue: {
            createDockerfile: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: ReactDockerIgnoreFileService,
          useValue: {
            addDockerIgnoreFile: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ReactProjectService>(ReactProjectService);
    scannerService = module.get<ReactProjectScannerService>(ReactProjectScannerService);
    dockerfileService = module.get<ReactDockerfileService>(ReactDockerfileService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    dockerIgnoreService = module.get<ReactDockerIgnoreFileService>(ReactDockerIgnoreFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processReactProject', () => {
    it('should process React project correctly', async () => {
      const payload = { projectPath: mockProjectPath };
      
      await service.processReactProject(payload);

      expect(scannerService.scan).toHaveBeenCalledWith(payload);
      expect(dockerfileService.createDockerfile).toHaveBeenCalledWith(mockProjectConfig);
      expect(dockerIgnoreService.addDockerIgnoreFile).toHaveBeenCalledWith(mockProjectConfig);
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventNames.SourceCodeReady, {
        projectPath: mockProjectPath,
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      jest.spyOn(scannerService, 'scan').mockRejectedValueOnce(error);
      
      const payload = { projectPath: mockProjectPath };
      
      await expect(service.processReactProject(payload)).rejects.toThrow(error);
      expect(dockerfileService.createDockerfile).not.toHaveBeenCalled();
      expect(dockerIgnoreService.addDockerIgnoreFile).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
}); 