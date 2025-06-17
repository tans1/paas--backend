import { RuntimeLogService } from './containter-runtime-log.service';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { LogType } from '../enums/log-type.enum';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('RuntimeLogService', () => {
  let service: RuntimeLogService;
  let projectRepo: { getAllProjects: jest.Mock };
  let dockerLogService: { handleDockerStream: jest.Mock };
  let deploymentUtils: { getLatestDeployment: jest.Mock };
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let stdout: EventEmitter;
  let stderr: EventEmitter;
  let onMock: jest.Mock;
  let exitCb!: (code: number) => void;
  let errCb!: (err: Error) => void;

  beforeEach(() => {
    projectRepo = { getAllProjects: jest.fn() };
    dockerLogService = { handleDockerStream: jest.fn().mockResolvedValue(undefined) };
    deploymentUtils = { getLatestDeployment: jest.fn() };
    service = new RuntimeLogService(projectRepo as any, dockerLogService as any, deploymentUtils as any);

    logSpy = jest.spyOn<any, any>(service['logger'], 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn<any, any>(service['logger'], 'error').mockImplementation(() => {});

    stdout = new EventEmitter();
    stderr = new EventEmitter();
    onMock = jest.fn((event: string, cb: any) => {
      if (event === 'exit') exitCb = cb;
      if (event === 'error') errCb = cb;
    });
    (spawn as jest.Mock).mockReturnValue({ stdout, stderr, on: onMock });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('onApplicationBootstrap', () => {
    it('logs and skips projects without deployments', async () => {
      projectRepo.getAllProjects.mockResolvedValue([{ deployments: [] }]);
      deploymentUtils.getLatestDeployment.mockReturnValue(null);

      await service.onApplicationBootstrap();

      expect(projectRepo.getAllProjects).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Bootstrapping container log streaming for all projects...');
    });

    it('attaches to logs when deployment exists', async () => {
      const proj = { deployments: [{ id: 5, containerName: 'ctr' }], repoId: 9, branch: 'main' };
      projectRepo.getAllProjects.mockResolvedValue([proj]);
      deploymentUtils.getLatestDeployment.mockReturnValue(proj.deployments[0]);
      const streamSpy = jest.spyOn(service, 'streamContainerLogs');

      await service.onApplicationBootstrap();

      expect(logSpy).toHaveBeenCalledWith(`Attaching to logs for container 'ctr' (project 5)`);
      expect(streamSpy).toHaveBeenCalledWith('ctr', 9, 'main', 5);
    });

    it('catches and logs errors per project', async () => {
      projectRepo.getAllProjects.mockResolvedValue([{ deployments: [{}], repoId:1, branch:'' }]);
      deploymentUtils.getLatestDeployment.mockImplementation(() => { throw new Error('bad'); });

      await service.onApplicationBootstrap();

      expect(errorSpy).toHaveBeenCalledWith('Error streaming logs for project', expect.any(Error));
    });
  });

  describe('streamContainerLogs', () => {
    it('spawns docker, streams via DockerLogService, and registers exit/error handlers', () => {
      service.streamContainerLogs('ctr', 1, 'b', 2);

      expect(spawn).toHaveBeenCalledWith('docker', ['logs', '--follow', '--tail', '0', 'ctr']);
      expect(dockerLogService.handleDockerStream).toHaveBeenCalledWith(stdout, 1, 'b', LogType.RUNTIME, 2);
      expect(dockerLogService.handleDockerStream).toHaveBeenCalledWith(stderr, 1, 'b', LogType.RUNTIME, 2);
      expect(onMock).toHaveBeenCalledWith('exit', expect.any(Function));
      expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('logs exit codes', () => {
      service.streamContainerLogs('ctr', 1, 'b', 2);
      exitCb(123);
      expect(logSpy).toHaveBeenCalledWith(`Log stream for 'ctr' exited with code 123`);
    });

    it('logs spawn errors', () => {
      service.streamContainerLogs('ctr', 1, 'b', 2);
      const error = new Error('oops');
      errCb(error);
      expect(errorSpy).toHaveBeenCalledWith(`Failed to spawn docker logs for 'ctr'`, error);
    });
  });
});
