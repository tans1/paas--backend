import { DockerService } from './docker-service';
import { EventNames } from '../../events/event.module';
import { FrameworkMap } from '../../framework-detector/framework.config';

describe('DockerService', () => {
  let service: DockerService;
  const mockEmitter = { emit: jest.fn() };
  const mockScanner = { scan: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DockerService(
      mockEmitter as any,
      mockScanner as any
    );
  });

  it('calls dockerfileScannerService.scan with the payload', async () => {
    const payload = { projectPath: '/app', configFile: 'Dockerfile' };
    mockScanner.scan.mockResolvedValue({ PORT: 1234 });
    await service.processVueProject(payload);
    expect(mockScanner.scan).toHaveBeenCalledWith(payload);
  });

  it('emits SourceCodeReady with projectPath, PORT, and dockerFile', async () => {
    const payload = { projectPath: '/app', configFile: 'Dockerfile' };
    mockScanner.scan.mockResolvedValue({ PORT: 4321 });

    await service.processVueProject(payload);

    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EventNames.SourceCodeReady,
      {
        projectPath: '/app',
        PORT: 4321,
        dockerFile: 'Dockerfile',
      }
    );
  });
});
