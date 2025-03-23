import { Test, TestingModule } from '@nestjs/testing';
import { NodeProjectService } from './node-project-service';
import { NodeProjectScannerService } from './node-project-scanner/node-project-scanner.service';
import { NodeDockerfileService } from './node-dockerfile/node-dockerfile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Framework } from '../frameworks.enum';

describe('NodeProjectService', () => {
  let service: NodeProjectService;
  let nodeProjectScannerService: NodeProjectScannerService;
  let nodeDockerfileService: NodeDockerfileService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodeProjectService,
        {
          provide: NodeProjectScannerService,
          useValue: {
            scan: jest.fn(),
          },
        },
        {
          provide: NodeDockerfileService,
          useValue: {
            createDockerfile: jest.fn(),
          },
        },
        EventEmitter2,
      ],
    }).compile();

    service = module.get<NodeProjectService>(NodeProjectService);
    nodeProjectScannerService = module.get<NodeProjectScannerService>(NodeProjectScannerService);
    nodeDockerfileService = module.get<NodeDockerfileService>(NodeDockerfileService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processNodeProject', () => {
    const payload = { projectPath: '/path/to/project' };
    const projectConfig = {
      projectPath: '/path/to/project',
      nodeVersion: '14.17.0',
      framework: 'NodeJS',
      startCommand: 'npm start',
      buildCommand: 'npm run build',
      defaultBuildLocation: 'dist',
    };

    it('should scan the project and create a Dockerfile', async () => {
      jest.spyOn(nodeProjectScannerService, 'scan').mockResolvedValue(projectConfig);
      jest.spyOn(nodeDockerfileService, 'createDockerfile').mockResolvedValue(undefined);

      await service.processNodeProject(payload);

      expect(nodeProjectScannerService.scan).toHaveBeenCalledWith(payload);
      expect(nodeDockerfileService.createDockerfile).toHaveBeenCalledWith(projectConfig);
    });
  });
});