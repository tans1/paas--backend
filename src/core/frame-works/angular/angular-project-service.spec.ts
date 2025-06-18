import { AngularProjectService } from './angular-project-service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PORT } from './constants';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '../../events/event.module';

describe('AngularProjectService', () => {
  let service: AngularProjectService;

  // Mock dependencies
  const mockScannerService = { scan: jest.fn() };
  const mockDockerfileService = { createDockerfile: jest.fn() };
  const mockDockerIgnoreService = { addDockerIgnoreFile: jest.fn() };
  const mockEventEmitter = { emit: jest.fn() };
  const mockAlsService = { getrepositoryId: jest.fn(), getbranchName: jest.fn() };
  const mockRepoService = { findByRepoAndBranch: jest.fn() };

  // Shared test data
  const payload = { projectPath: '/some/path' };
  const scannedConfig = {
    projectPath: '/some/path',
    nodeVersion: '20',
    defaultBuildLocation: 'dist/out',
  };
  const repoProject = {
    installCommand: 'npm install',
    buildCommand: undefined, // Will test fallback
    outputDirectory: undefined, // Will test fallback
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AngularProjectService(
      mockScannerService as any,
      mockDockerfileService as any,
      mockDockerIgnoreService as any,
      mockEventEmitter as any,
      mockAlsService as any,
      mockRepoService as any,
    );

    // Set up default mocks
    mockScannerService.scan.mockResolvedValue(scannedConfig);
    mockAlsService.getrepositoryId.mockReturnValue('abc123');
    mockAlsService.getbranchName.mockReturnValue('main');
    mockRepoService.findByRepoAndBranch.mockResolvedValue(repoProject);
  });

  it('calls AngularProjectScannerService.scan with the payload', async () => {
    await service.processAngularProject(payload);
    expect(mockScannerService.scan).toHaveBeenCalledWith(payload);
  });

  it('fetches repo ID and branch name using AlsService', async () => {
    await service.processAngularProject(payload);
    expect(mockAlsService.getrepositoryId).toHaveBeenCalled();
    expect(mockAlsService.getbranchName).toHaveBeenCalled();
  });

  it('calls ProjectsRepositoryInterface.findByRepoAndBranch with correct args', async () => {
    await service.processAngularProject(payload);
    expect(mockRepoService.findByRepoAndBranch).toHaveBeenCalledWith('abc123', 'main');
  });

  it('extends projectConfig with installCommand, buildCommand, and outputDirectory', async () => {
    await service.processAngularProject(payload);
    expect(mockDockerfileService.createDockerfile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectPath: '/some/path',
        installCommand: 'npm install', // from repoProject
        buildCommand: FrameworkMap.Angular.settings.buildCommand.value, // fallback to FrameworkMap
        outputDirectory: 'dist/out', // from scannedConfig.defaultBuildLocation
      })
    );
  });

  it('calls AngularDockerIgnoreFileService.addDockerIgnoreFile with scanned config', async () => {
    await service.processAngularProject(payload);
    expect(mockDockerIgnoreService.addDockerIgnoreFile).toHaveBeenCalledWith(scannedConfig);
  });

  it('emits SourceCodeReady event with correct params', async () => {
    await service.processAngularProject(payload);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventNames.SourceCodeReady, {
      projectPath: '/some/path',
      PORT: PORT,
    });
  });
});
