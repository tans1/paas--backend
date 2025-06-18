import { PythonService } from './python.service';
import { EventNames } from '@/core/events/event.module';
import { FrameworkMap } from '../../framework-detector/framework.config';

describe('PythonService', () => {
  let service: PythonService;
  const mockEmitter = { emit: jest.fn() };
  const mockAls = { getrepositoryId: jest.fn(), getbranchName: jest.fn() };
  const mockRepo = { findByRepoAndBranch: jest.fn() };
  const mockDockerfile = { createDockerfile: jest.fn() };
  const mockIgnore = { addDockerIgnoreFile: jest.fn() };
  const mockScanner = { scan: jest.fn() };

  const payload = { projectPath: '/pyproj' };
  const repoData = { installCommand: 'pip install .', outputDirectory: 'dist', runCommand: 'serve' };
  const scanResult = { projectPath: '/pyproj', pythonVersion: '3.10', depsType: 'pip', installFlags: '', hasLockFile: true };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PythonService(
      mockEmitter as any,
      mockAls as any,
      mockRepo as any,
      mockDockerfile as any,
      mockIgnore as any,
      mockScanner as any,
    );
    mockAls.getrepositoryId.mockReturnValue('RID');
    mockAls.getbranchName.mockReturnValue('BR');
    mockRepo.findByRepoAndBranch.mockResolvedValue(repoData);
    mockScanner.scan.mockResolvedValue(scanResult);
  });

  it('fetches repo and branch from AlsService', async () => {
    await service.processPythonProject(payload);
    expect(mockAls.getrepositoryId).toHaveBeenCalled();
    expect(mockAls.getbranchName).toHaveBeenCalled();
  });

  it('loads project from repository', async () => {
    await service.processPythonProject(payload);
    expect(mockRepo.findByRepoAndBranch).toHaveBeenCalledWith('RID', 'BR');
  });

  it('calls scanner.scan with payload', async () => {
    await service.processPythonProject(payload);
    expect(mockScanner.scan).toHaveBeenCalledWith(payload);
  });

  it('merges config, then calls createDockerfile & addDockerIgnoreFile', async () => {
    await service.processPythonProject(payload);
    expect(mockDockerfile.createDockerfile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectPath: '/pyproj',
        pythonVersion: '3.10',
        installCommand: 'pip install .',
        outputDirectory: 'dist',
        runCommand: 'serve',
        depsType: 'pip',
        installFlags: '',
        hasLockFile: true,
      })
    );
    expect(mockIgnore.addDockerIgnoreFile).toHaveBeenCalledWith(
      expect.objectContaining({ projectPath: '/pyproj' })
    );
  });

  it('emits SourceCodeReady with projectPath and PORT env fallback', async () => {
    delete process.env.PORT;
    await service.processPythonProject(payload);
    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EventNames.SourceCodeReady,
      { projectPath: '/pyproj', PORT: 8000 }
    );
  });
});
