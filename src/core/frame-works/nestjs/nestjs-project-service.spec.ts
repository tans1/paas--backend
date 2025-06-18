import { NestJsProjectService } from './nestjs-project-service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '../../events/event.module';
import { PORT } from './constants';

describe('NestJsProjectService', () => {
  let service: NestJsProjectService;

  // Mocks for dependencies
  const mockScannerService = { scan: jest.fn() };
  const mockDockerfileService = { createDockerfile: jest.fn() };
  const mockDockerIgnoreService = { addDockerIgnoreFile: jest.fn() };
  const mockEventEmitter = { emit: jest.fn() };
  const mockAlsService = { getrepositoryId: jest.fn(), getbranchName: jest.fn() };
  const mockRepoService = { findByRepoAndBranch: jest.fn() };

  // Shared test data
  const payload = { projectPath: '/test/path' };
  const scannedConfig = {
    projectPath: '/test/path',
    nodeVersion: '18',
    defaultBuildLocation: 'dist',
  };
  const repoProject = {
    installCommand: 'npm ci',
    buildCommand: 'npm run build',
    outputDirectory: 'custom-out',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new NestJsProjectService(
      mockScannerService as any,
      mockDockerfileService as any,
      mockEventEmitter as any,
      mockDockerIgnoreService as any,
      mockAlsService as any,
      mockRepoService as any,
    );

    mockScannerService.scan.mockResolvedValue(scannedConfig);
    mockAlsService.getrepositoryId.mockReturnValue('repo123');
    mockAlsService.getbranchName.mockReturnValue('feature-branch');
    mockRepoService.findByRepoAndBranch.mockResolvedValue(repoProject);
  });

  it('calls NestJsProjectScannerService.scan with the payload', async () => {
    await service.processVueProject(payload);
    expect(mockScannerService.scan).toHaveBeenCalledWith(payload);
  });

  it('retrieves repo ID and branch name from AlsService', async () => {
    await service.processVueProject(payload);
    expect(mockAlsService.getrepositoryId).toHaveBeenCalled();
    expect(mockAlsService.getbranchName).toHaveBeenCalled();
  });

  it('calls ProjectsRepositoryInterface.findByRepoAndBranch with correct args', async () => {
    await service.processVueProject(payload);
    expect(mockRepoService.findByRepoAndBranch).toHaveBeenCalledWith(
      'repo123',
      'feature-branch'
    );
  });

  it('calls NestJsDockerfileService.createDockerfile with merged config', async () => {
    await service.processVueProject(payload);
    expect(mockDockerfileService.createDockerfile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectPath: '/test/path',
        nodeVersion: '18',
        installCommand: 'npm ci',
        buildCommand: 'npm run build',
        outputDirectory: 'custom-out',
        runCommand: FrameworkMap.NestJS.settings.runCommand.value,
      })
    );
  });

  it('calls NestJsDockerIgnoreFileService.addDockerIgnoreFile with scanned config', async () => {
    await service.processVueProject(payload);
    expect(mockDockerIgnoreService.addDockerIgnoreFile).toHaveBeenCalledWith(
      scannedConfig
    );
  });

  it('emits SourceCodeReady event with correct payload', async () => {
    await service.processVueProject(payload);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      EventNames.SourceCodeReady,
      {
        projectPath: '/test/path',
        PORT: PORT,
      }
    );
  });
});
