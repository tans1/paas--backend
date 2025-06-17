import { ViteProjectService } from './vite-project-service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';

describe('ViteProjectService', () => {
  let service: ViteProjectService;

  const mockScanner = { scan: jest.fn() };
  const mockDockerfile = { createDockerfile: jest.fn() };
  const mockIgnore = { addDockerIgnoreFile: jest.fn() };
  const mockEmitter = { emit: jest.fn() };
  const mockAls = { getrepositoryId: jest.fn(), getbranchName: jest.fn() };
  const mockRepo = { findByRepoAndBranch: jest.fn() };

  const payload = { projectPath: '/vite-app' };
  const scanned = {
    projectPath: '/vite-app',
    nodeVersion: '18',
    defaultBuildLocation: 'dist',
  };
  const repoConf = {
    installCommand: undefined,
    buildCommand: 'npm run build',
    outputDirectory: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ViteProjectService(
      mockScanner as any,
      mockDockerfile as any,
      mockEmitter as any,
      mockIgnore as any,
      mockAls as any,
      mockRepo as any,
    );
    mockScanner.scan.mockResolvedValue(scanned);
    mockAls.getrepositoryId.mockReturnValue('RID');
    mockAls.getbranchName.mockReturnValue('BR');
    mockRepo.findByRepoAndBranch.mockResolvedValue(repoConf);
  });

  it('invokes scan with the event payload', async () => {
    await service.processViteProject(payload);
    expect(mockScanner.scan).toHaveBeenCalledWith(payload);
  });

  it('retrieves repo ID and branch', async () => {
    await service.processViteProject(payload);
    expect(mockAls.getrepositoryId).toHaveBeenCalled();
    expect(mockAls.getbranchName).toHaveBeenCalled();
  });

  it('queries repository with correct args', async () => {
    await service.processViteProject(payload);
    expect(mockRepo.findByRepoAndBranch).toHaveBeenCalledWith('RID', 'BR');
  });

  it('calls createDockerfile with merged config and fallbacks', async () => {
    await service.processViteProject(payload);
    expect(mockDockerfile.createDockerfile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectPath: '/vite-app',
        installCommand: FrameworkMap.Vite.settings.installCommand.value,
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
      }),
    );
  });

  it('calls addDockerIgnoreFile with the scanned config', async () => {
    await service.processViteProject(payload);
    expect(mockIgnore.addDockerIgnoreFile).toHaveBeenCalledWith(scanned);
  });

  it('emits SourceCodeReady with projectPath', async () => {
    await service.processViteProject(payload);
    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EventNames.SourceCodeReady,
      { projectPath: '/vite-app' },
    );
  });
});
