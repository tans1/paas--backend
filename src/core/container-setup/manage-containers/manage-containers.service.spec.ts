import { ManageContainerService } from './manage-containers.service';
import { spawn } from 'child_process';

jest.mock('child_process', () => ({ spawn: jest.fn() }));

describe('ManageContainerService', () => {
  let svc: ManageContainerService;
  const dockerHub: any = {};
  const runtimeLog: any = { streamContainerLogs: jest.fn() };
  const dockerCompose: any = { up: jest.fn() };

  beforeEach(() => {
    svc = new ManageContainerService(dockerHub, runtimeLog, dockerCompose);
  });
  afterEach(() => jest.resetAllMocks());

  describe('start', () => {
    it('removes old, runs new, and streams logs', async () => {
      const rmChild = { on: jest.fn((e, cb) => e==='exit'&&cb(0)) };
      const runChild = { on: jest.fn((e, cb) => e==='exit'&&cb(0)) };
      (spawn as jest.Mock).mockReturnValueOnce(rmChild).mockReturnValueOnce(runChild);

      const dep = { containerName:'cn', imageName:'im', branch:'b', id:5 } as any;
      await svc.start('/p',1,dep);

      expect(spawn).toHaveBeenCalledWith('docker',['rm','-f','cn'],{stdio:'inherit',env:process.env,cwd:'/p'});
      expect(spawn).toHaveBeenCalledWith('docker',['run','-d','--name','cn','im'],{stdio:'inherit',env:process.env,cwd:'/p'});
      expect(runtimeLog.streamContainerLogs).toHaveBeenCalledWith('cn',1,'b',5);
    });

    it('rejects if rm fails', async () => {
      const rmChild = { on: jest.fn((e, cb) => e==='exit'&&cb(1)) };
      (spawn as jest.Mock).mockReturnValueOnce(rmChild);
      const dep = { containerName:'cn', imageName:'im', branch:'b', id:5 } as any;
      await expect(svc.start('/p',1,dep)).rejects.toThrow();
    });
  });

  describe('stop & reStartStoppedContainer', () => {
    it('stops container', async () => {
      const child = { on: jest.fn((e,cb)=>e==='exit'&&cb(0)) };
      (spawn as jest.Mock).mockReturnValueOnce(child);
      await svc.stop('/p',{ containerName:'c'} as any);
      expect(spawn).toHaveBeenCalledWith('docker',['stop','c'],{stdio:'inherit',env:process.env,cwd:'/p'});
    });

    it('restarts stopped', async () => {
      const child = { on: jest.fn((e,cb)=>e==='exit'&&cb(0)) };
      (spawn as jest.Mock).mockReturnValueOnce(child);
      await svc.reStartStoppedContainer('/p',{ containerName:'c'} as any);
      expect(spawn).toHaveBeenCalledWith('docker',['start','c'],{stdio:'inherit',env:process.env,cwd:'/p'});
    });
  });

  describe('rollback', () => {
    it('does pull, up, and stream', async () => {
      dockerHub.pullImage = jest.fn().mockResolvedValue(undefined);
      dockerCompose.up = jest.fn().mockResolvedValue(undefined);
      runtimeLog.streamContainerLogs = jest.fn().mockResolvedValue(undefined);
      const dep = { imageName:'i', containerName:'c', branch:'b', id:7, extension:'e' } as any;

      await svc.rollback('/p','proj',1,'dc.yml',dep);

      expect(dockerHub.pullImage).toHaveBeenCalledWith('i',1,'b',7);
      expect(dockerCompose.up).toHaveBeenCalledWith('/p','dc.yml','e','proj');
      expect(runtimeLog.streamContainerLogs).toHaveBeenCalledWith('c',1,'b',7);
    });

    it('throws on failure', async () => {
      dockerHub.pullImage = jest.fn().mockRejectedValue(new Error('no'));
      const dep = { imageName:'i', containerName:'c', branch:'b', id:7, extension:'e' } as any;
      await expect(svc.rollback('/p','proj',1,'f',dep))
        .rejects.toThrow('[ROLLBACK_FAILED] no');
    });
  });

  describe('cleanup', () => {
    it('prunes network', async () => {
      const child = { on: jest.fn((e,cb)=>e==='exit'&&cb(0)) };
      (spawn as jest.Mock).mockReturnValueOnce(child);
      await svc.cleanup('/p');
      expect(spawn).toHaveBeenCalledWith(
        'docker',
        ['network','prune','-f','--filter','name=project_network'],
        { stdio:'inherit', env: process.env, cwd: '/p' },
      );
    });
  });

   describe('rm', () => {
    it('resolves on success', async () => {
      const child = { on: jest.fn((ev, cb) => ev === 'exit' && cb(0)) };
      (spawn as jest.Mock).mockReturnValueOnce(child);

      await expect(svc.rm('cn', '/p')).resolves.toBeUndefined();
      expect(spawn).toHaveBeenCalledWith(
        'docker',
        ['rm', '-f', 'cn'],
        { stdio: 'inherit', env: process.env, cwd: '/p' },
      );
    });

    it('rejects on error with wrapped message', async () => {
      const child = { on: jest.fn((ev, cb) => ev === 'error' && cb(new Error('oops'))) };
      (spawn as jest.Mock).mockReturnValueOnce(child);

      await expect(svc.rm('cn', '/p')).rejects.toThrow(
        'Failed to remove container cn: Failed to execute docker command: oops',
      );
    });
  });
});
