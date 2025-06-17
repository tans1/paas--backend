import { ReactProjectService } from './react-project-service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '../../events/event.module';

describe('ReactProjectService', () => {
  let service: ReactProjectService;

  // mocks
  const mockScanner = { scan: jest.fn() };
  const mockDockerfile = { createDockerfile: jest.fn() };
  const mockIgnorefile = { addDockerIgnoreFile: jest.fn() };
  const mockEmitter = { emit: jest.fn() };
  const mockAls = { getrepositoryId: jest.fn(), getbranchName: jest.fn() };
  const mockRepo = { findByRepoAndBranch: jest.fn() };

  const payload = { projectPath: '/app' };
  const scanned = {
    projectPath: '/app',
    nodeVersion: '18',
    defaultBuildLocation: 'build',
  };
  const repoData = {
    installCommand: 'npm ci',
    buildCommand: undefined,
    outputDirectory: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReactProjectService(
      mockScanner as any,
      mockDockerfile as any,
      mockEmitter as any,
      mockIgnorefile as any,
      mockAls as any,
      mockRepo as any,
    );
    mockScanner.scan.mockResolvedValue(scanned);
    mockAls.getrepositoryId.mockReturnValue('rid');
    mockAls.getbranchName.mockReturnValue('br');
    mockRepo.findByRepoAndBranch.mockResolvedValue(repoData);
  });

  it('calls scanner.scan with the event payload', async () => {
    await service.processReactProject(payload);
    expect(mockScanner.scan).toHaveBeenCalledWith(payload);
  });

  it('retrieves repo ID and branch from AlsService', async () => {
    await service.processReactProject(payload);
    expect(mockAls.getrepositoryId).toHaveBeenCalled();
    expect(mockAls.getbranchName).toHaveBeenCalled();
  });

  it('calls projectRepositoryService.findByRepoAndBranch correctly', async () => {
    await service.processReactProject(payload);
    expect(mockRepo.findByRepoAndBranch).toHaveBeenCalledWith('rid', 'br');
  });

  it('calls createDockerfile with merged config and fallbacks', async () => {
    await service.processReactProject(payload);
    expect(mockDockerfile.createDockerfile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectPath: '/app',
        installCommand: 'npm ci',
        buildCommand: FrameworkMap.React.settings.buildCommand.value,
        outputDirectory: 'build',
      }),
    );
  });

  it('calls addDockerIgnoreFile with the scanned config', async () => {
    await service.processReactProject(payload);
    expect(mockIgnorefile.addDockerIgnoreFile).toHaveBeenCalledWith(scanned);
  });

  it('emits SourceCodeReady event with correct payload', async () => {
    await service.processReactProject(payload);
    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EventNames.SourceCodeReady,
      { projectPath: '/app' },
    );
  });
});
