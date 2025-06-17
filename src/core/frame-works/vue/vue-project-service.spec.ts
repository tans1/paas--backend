import { VueProjectService } from './vue-project-service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '../../events/event.module';
import { PORT } from './constants';

describe('VueProjectService', () => {
  let service: VueProjectService;

  // mocks
  const mockScanner = { scan: jest.fn() };
  const mockDockerfile = { createDockerfile: jest.fn() };
  const mockIgnorefile = { addDockerIgnoreFile: jest.fn() };
  const mockEmitter = { emit: jest.fn() };
  const mockAls = { getrepositoryId: jest.fn(), getbranchName: jest.fn() };
  const mockRepo = { findByRepoAndBranch: jest.fn() };

  const payload = { projectPath: '/vue-app' };
  const scanned = {
    projectPath: '/vue-app',
    nodeVersion: '18',
    defaultBuildLocation: 'dist',
  };
  const repoData = {
    installCommand: undefined,
    buildCommand: 'npm run build',
    outputDirectory: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VueProjectService(
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

  it('invokes scan with payload', async () => {
    await service.processVueProject(payload);
    expect(mockScanner.scan).toHaveBeenCalledWith(payload);
  });

  it('fetches repo ID and branch', async () => {
    await service.processVueProject(payload);
    expect(mockAls.getrepositoryId).toHaveBeenCalled();
    expect(mockAls.getbranchName).toHaveBeenCalled();
  });

  it('finds project from repository service', async () => {
    await service.processVueProject(payload);
    expect(mockRepo.findByRepoAndBranch).toHaveBeenCalledWith('rid', 'branch');
  });

  it('calls createDockerfile with merged defaults and settings', async () => {
    await service.processVueProject(payload);
    expect(mockDockerfile.createDockerfile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectPath: '/vue-app',
        installCommand: FrameworkMap.Vue.settings.installCommand.value,
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
      }),
    );
  });

  it('calls addDockerIgnoreFile with scanned config', async () => {
    await service.processVueProject(payload);
    expect(mockIgnorefile.addDockerIgnoreFile).toHaveBeenCalledWith(scanned);
  });

  it('emits SourceCodeReady with projectPath and PORT', async () => {
    await service.processVueProject(payload);
    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EventNames.SourceCodeReady,
      { projectPath: '/vue-app', PORT: PORT },
    );
  });
});
