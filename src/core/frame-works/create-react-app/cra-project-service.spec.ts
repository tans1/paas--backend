import { CRAProjectService } from './cra-project-service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';

describe('CRAProjectService', () => {
  let service: CRAProjectService;

  // mocks
  const mockScanner = { scan: jest.fn() };
  const mockDockerfile = { createDockerfile: jest.fn() };
  const mockIgnorefile = { addDockerIgnoreFile: jest.fn() };
  const mockEmitter = { emit: jest.fn() };
  const mockAls = { getrepositoryId: jest.fn(), getbranchName: jest.fn() };
  const mockRepo = { findByRepoAndBranch: jest.fn() };

  const payload = { projectPath: '/cra-app' };
  const scanned = {
    projectPath: '/cra-app',
    nodeVersion: '18',
    defaultBuildLocation: 'build',
  };
  const repoData = {
    installCommand: undefined,
    buildCommand: undefined,
    outputDirectory: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CRAProjectService(
      mockScanner as any,
      mockDockerfile as any,
      mockEmitter as any,
      mockIgnorefile as any,
      mockAls as any,
      mockRepo as any,
    );
    mockScanner.scan.mockResolvedValue(scanned);
    mockAls.getrepositoryId.mockReturnValue('rid');
    mockAls.getbranchName.mockReturnValue('branch');
    mockRepo.findByRepoAndBranch.mockResolvedValue(repoData);
  });

  it('calls scanner.scan with payload', async () => {
    await service.processCRAProject(payload);
    expect(mockScanner.scan).toHaveBeenCalledWith(payload);
  });

  it('fetches repo ID and branch from AlsService', async () => {
    await service.processCRAProject(payload);
    expect(mockAls.getrepositoryId).toHaveBeenCalled();
    expect(mockAls.getbranchName).toHaveBeenCalled();
  });

  it('calls findByRepoAndBranch with correct args', async () => {
    await service.processCRAProject(payload);
    expect(mockRepo.findByRepoAndBranch).toHaveBeenCalledWith('rid', 'branch');
  });

  it('calls createDockerfile with merged config and defaults', async () => {
    await service.processCRAProject(payload);
    expect(mockDockerfile.createDockerfile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectPath: '/cra-app',
        installCommand: FrameworkMap.CreateReactApp.settings.installCommand.value,
        buildCommand: FrameworkMap.CreateReactApp.settings.buildCommand.value,
        outputDirectory: 'build',
      }),
    );
  });

  it('calls addDockerIgnoreFile with scanned config', async () => {
    await service.processCRAProject(payload);
    expect(mockIgnorefile.addDockerIgnoreFile).toHaveBeenCalledWith(scanned);
  });

  it('emits SourceCodeReady event with projectPath only', async () => {
    await service.processCRAProject(payload);
    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EventNames.SourceCodeReady,
      { projectPath: '/cra-app' },
    );
  });
});
