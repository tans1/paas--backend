import { DockerLogService } from './docker-log.service';
import { ImageBuildGateway } from '../gateway/image-build/Image-build-gateway';
import { DeploymentRepositoryInterface } from '@/infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { Readable } from 'stream';

describe('DockerLogService', () => {
  let service: DockerLogService;
  let gateway: { sendLogToUser: jest.Mock };
  let repo: { addLog: jest.Mock };

  beforeEach(() => {
    gateway = { sendLogToUser: jest.fn() };
    repo = { addLog: jest.fn() };
    service = new DockerLogService(
      gateway as unknown as ImageBuildGateway,
      {} as any,
      repo as unknown as DeploymentRepositoryInterface,
    );
  });

  describe('handleDockerStream', () => {
    it('emits each full line (gateway + logMessage) and stores logs', async () => {
      const lines = ['one\n', 'two\n', 'three\n'];
      class TestStream extends Readable {
        private idx = 0;
        _read() {
          // emit one chunk per line
          if (this.idx < lines.length) {
            this.push(lines[this.idx++]);
          } else {
            this.push(null);
          }
        }
      }
      const stream = new TestStream();

      await service.handleDockerStream(stream, 1, 'br', 'lt', 99);

      // 3 lines → each sent twice: once in data handler and once in logMessage
      expect(gateway.sendLogToUser).toHaveBeenCalledTimes(6);
      // repo.addLog only via logMessage → 3 calls
      expect(repo.addLog).toHaveBeenCalledTimes(3);
    });

    it('rejects on stream error', async () => {
      // Use Readable so 'error' handler is attached before error fires
      const stream = new Readable({
        read() {
          this.emit('error', new Error('boom'));
        },
      });

      await expect(service.handleDockerStream(stream as any, 1, 'b', 't', 0))
        .rejects.toThrow('boom');
    });
  });

  describe('logMessage', () => {
    it('sends and stores when deploymentId present', async () => {
      await service.logMessage('msg', 1, 'b', 't', 123);
      expect(gateway.sendLogToUser).toHaveBeenCalledWith(1, 'b', 't', 'msg', false);
      expect(repo.addLog).toHaveBeenCalledWith({
        deploymentId: 123,
        logLevel: 'info',
        message: 'msg',
        logType: 't',
      });
    });

    it('only sends when no deploymentId', async () => {
      await service.logMessage('msg2', 2, 'br2', 'lt2', undefined);
      expect(gateway.sendLogToUser).toHaveBeenCalledWith(2, 'br2', 'lt2', 'msg2', false);
      expect(repo.addLog).not.toHaveBeenCalled();
    });
  });
});
