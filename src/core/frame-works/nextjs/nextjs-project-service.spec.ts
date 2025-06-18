import { NextJsProjectService } from './nextjs-project-service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { PORT } from './constants';

describe('NextJsProjectService', () => {
  let service: NextJsProjectService;

  const mockScanner = { scan: jest.fn() };
  const mockDockerfile = { createDockerfile: jest.fn() };
  const mockIgnore = { addDockerIgnoreFile: jest.fn() };
  const mockEmitter = { emit: jest.fn() };
  const mockAls = { getrepositoryId: jest.fn(), getbranchName: jest.fn() };
  const mockRepo = { findByRepoAndBranch: jest.fn() };

  const payload = { projectPath: '/nxapp' };
  const scanned = {
    projectPath: '/nxapp',
    nodeVersion: '18',
    output: 'export',
    distDir: 'build',
  };
  const repoConf = {
    installCommand: undefined,
    buildCommand: 'build:cmd',
    outputDirectory: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NextJsProjectService(
      mockScanner as any,
      mockDockerfile as any,
      mockIgnore as any,
      mockEmitter as any,
      mockAls as any,
      mockRepo as any,
    );
    mockScanner.scan.mockResolvedValue(scanned);
    mockAls.getrepositoryId.mockReturnValue('RID');
    mockAls.getbranchName.mockReturnValue('BR');
    mockRepo.findByRepoAndBranch.mockResolvedValue(repoConf);
  });

  it('invokes scanner.scan with payload', async () => {
    await service.processNextJsProject(payload);
    expect(mockScanner.scan).toHaveBeenCalledWith(payload);
  });

  it('retrieves repo ID and branch', async () => {
    await service.processNextJsProject(payload);
    expect(mockAls.getrepositoryId).toHaveBeenCalled();
    expect(mockAls.getbranchName).toHaveBeenCalled();
  });

  it('calls findByRepoAndBranch correctly', async () => {
    await service.processNextJsProject(payload);
    expect(mockRepo.findByRepoAndBranch).toHaveBeenCalledWith('RID', 'BR');
  });

  it('calls createDockerfile with merged config', async () => {
    await service.processNextJsProject(payload);
    expect(mockDockerfile.createDockerfile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectPath: '/nxapp',
        installCommand: FrameworkMap.NextJs.settings.installCommand.value,
        buildCommand: 'build:cmd',
        outputDirectory: 'build',
        runCommand: FrameworkMap.NextJs.settings.runCommand.value,
        output: 'export',
        nodeVersion: '18',
      }),
    );
  });

  it('calls addDockerIgnoreFile with projectConfig', async () => {
    await service.processNextJsProject(payload);
    expect(mockIgnore.addDockerIgnoreFile).toHaveBeenCalledWith(scanned);
  });

  it('emits SourceCodeReady event with correct payload', async () => {
    await service.processNextJsProject(payload);
    expect(mockEmitter.emit).toHaveBeenCalledWith(EventNames.SourceCodeReady, {
      projectPath: '/nxapp',
      PORT: PORT,
    });
  });
});
