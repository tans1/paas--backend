import * as Docker from 'dockerode';
import { DockerHubService } from './docker-hub.service';
import { Readable } from 'stream';
import { LogType } from '../enums/log-type.enum';


jest.mock('dockerode', () =>
  jest.fn().mockImplementation(() => ({
    getImage: jest.fn().mockReturnThis(),
    push: jest.fn(),
    pull: jest.fn(),
  })),
);


describe('DockerHubService', () => {
  let service: DockerHubService;
  let dockerLogService: { handleDockerStream: jest.Mock };
  let fakeDocker: any;

  beforeEach(() => {
    dockerLogService = { handleDockerStream: jest.fn().mockResolvedValue(undefined) };
    process.env.DOCKER_USERNAME = 'user';
    process.env.DOCKER_PASSWORD = 'pass';

    // Instantiate service after mocking
    service = new DockerHubService(dockerLogService as any, {} as any);

    // Grab the internal Docker instance
    fakeDocker = (Docker as jest.MockedClass<typeof Docker>).mock.instances[0];

    // Now ensure our methods are fresh jest.fn()
    fakeDocker.getImage = jest.fn().mockReturnThis();
    fakeDocker.push = jest.fn();
    fakeDocker.pull = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('pushImage', () => {
    it('pushes image and streams logs', async () => {
      const stream = new Readable({ read() {} });
      fakeDocker.push.mockResolvedValueOnce(stream);

      await service.pushImage('my-image', 10, 'branch', 20);

      expect(fakeDocker.getImage).toHaveBeenCalledWith('my-image');
      expect(fakeDocker.push).toHaveBeenCalledWith({
        authconfig: { username: 'user', password: 'pass' },
      });
      expect(dockerLogService.handleDockerStream).toHaveBeenCalledWith(
        stream, 10, 'branch', LogType.BUILD, 20
      );
    });

    it('throws and wraps on push failure', async () => {
      fakeDocker.push.mockRejectedValueOnce(new Error('badpush'));
      await expect(
        service.pushImage('img', 1, 'b', 2)
      ).rejects.toThrow('[DOCKER_PUSH_FAILED] badpush');
    });
  });

  describe('pullImage', () => {
    it('pulls image and streams logs', async () => {
      const stream = new Readable({ read() {} });
      fakeDocker.pull.mockResolvedValueOnce(stream);

      await service.pullImage('repo/image', 30, 'dev', 40);

      expect(fakeDocker.pull).toHaveBeenCalledWith('repo/image', {
        authconfig: { username: 'user', password: 'pass' },
      });
      expect(dockerLogService.handleDockerStream).toHaveBeenCalledWith(
        stream, 30, 'dev', LogType.BUILD, 40
      );
    });

    it('throws and wraps on pull failure', async () => {
      fakeDocker.pull.mockRejectedValueOnce(new Error('badpull'));
      await expect(
        service.pullImage('repo', 3, 'b', 4)
      ).rejects.toThrow('[DOCKER_PULL_FAILED] badpull');
    });
  });
});
