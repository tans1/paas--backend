import { ImageBuildService } from './image-build.service';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('ImageBuildService', () => {
  let service: ImageBuildService;
  let dockerLogService: { handleDockerStream: jest.Mock };
  let fakeChild: {
    stdout: EventEmitter;
    stderr: EventEmitter;
    on: jest.Mock;
  };
  let exitCb!: (code: number) => void;
  let errorCb!: (err: Error) => void;

  beforeEach(() => {
    dockerLogService = { handleDockerStream: jest.fn().mockResolvedValue(undefined) };
    service = new ImageBuildService(dockerLogService as any, {} as any);

    fakeChild = {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      on: jest.fn((event: string, cb: any) => {
        if (event === 'exit') exitCb = cb;
        if (event === 'error') errorCb = cb;
      }),
    };
    (spawn as jest.Mock).mockReturnValue(fakeChild);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('buildImage', () => {
    it('resolves when exit code is 0', async () => {
      const p = service.buildImage('/proj', 1, 2, 'main', 'img', 'Dockerfile.x');
      // schedule exit after on() handlers are attached
      setImmediate(() => exitCb(0));
      await expect(p).resolves.toBeUndefined();

      expect(spawn).toHaveBeenCalledWith(
        'docker',
        ['build', '-t', 'img', '-f', 'Dockerfile.x', '.'],
        { cwd: '/proj' },
      );
      expect(dockerLogService.handleDockerStream).toHaveBeenCalledTimes(2);
    });

    it('rejects when exit code non-zero', async () => {
      const p = service.buildImage('/p', 1, 2, 'b', 'i', 'Df');
      setImmediate(() => exitCb(123));
      await expect(p).rejects.toThrow('Docker build failed with exit code 123');
    });

    it('rejects on spawn error', async () => {
      const p = service.buildImage('/p', 1, 2, 'b', 'i', 'Df');
      setImmediate(() => errorCb(new Error('oops')));
      await expect(p).rejects.toThrow('Failed to execute docker build: oops');
    });
  });

  describe('removeImage', () => {
    it('resolves when rmi exit code is 0', async () => {
      const child = new EventEmitter() as any;
      child.on = jest.fn((ev, cb) => child.addListener(ev, cb));
      (spawn as jest.Mock).mockReturnValueOnce(child);

      const p = service.removeImage('img', '/p');
      child.emit('exit', 0);
      await expect(p).resolves.toBeUndefined();
    });

    it('rejects on non-zero exit', async () => {
      const child = new EventEmitter() as any;
      child.on = jest.fn((ev, cb) => child.addListener(ev, cb));
      (spawn as jest.Mock).mockReturnValueOnce(child);

      const p = service.removeImage('img', '/p');
      child.emit('exit', 5);
      await expect(p).rejects.toThrow('docker rmi failed with code 5');
    });

    it('rejects on error', async () => {
      const child = new EventEmitter() as any;
      child.on = jest.fn((ev, cb) => child.addListener(ev, cb));
      (spawn as jest.Mock).mockReturnValueOnce(child);

      const p = service.removeImage('img', '/p');
      child.emit('error', new Error('rmerr'));
      await expect(p).rejects.toThrow('Failed to remove image: rmerr');
    });
  });
});
