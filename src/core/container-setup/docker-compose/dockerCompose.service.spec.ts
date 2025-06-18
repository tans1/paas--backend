import { DockerComposeService } from './dockerCompose.service';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

jest.mock('child_process', () => ({ spawn: jest.fn() }));
jest.mock('fs', () => ({ readFileSync: jest.fn() }));
jest.mock('path', () => ({ join: jest.fn((...p) => p.join('/')) }));
jest.mock('dotenv', () => ({ parse: jest.fn() }));

describe('DockerComposeService', () => {
  let svc: DockerComposeService;

  beforeEach(() => {
    svc = new DockerComposeService();
  });
  afterEach(() => jest.resetAllMocks());

  describe('up', () => {
    it('reads .env, parses, and spawns docker compose up', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('K=V');
      (dotenv.parse as jest.Mock).mockReturnValue({ K: 'V' });
      const child = { on: jest.fn((ev, cb) => ev === 'exit' && cb(0)) };
      (spawn as jest.Mock).mockReturnValue(child);

      await svc.up('/proj', 'dc.yml', 'ext', 'proj');

      expect(path.join).toHaveBeenCalledWith('/proj', 'proj.ext.env');
      expect(fs.readFileSync).toHaveBeenCalledWith('/proj/proj.ext.env', 'utf-8');
      expect(dotenv.parse).toHaveBeenCalledWith('K=V');
      expect(spawn).toHaveBeenCalledWith(
        'docker',
        ['compose', '-f', 'dc.yml', 'up', '-d'],
        { cwd: '/proj', stdio: 'inherit', env: expect.objectContaining({ K: 'V', EXTENSION: 'ext' }) },
      );
    });

    it('rejects on readFileSync error', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => { throw new Error('nofile'); });
      await expect(svc.up('/x','f','e','p')).rejects.toThrow('nofile');
    });

    it('rejects on non-zero exit', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('');
      (dotenv.parse as jest.Mock).mockReturnValue({});
      const child = { on: jest.fn((ev, cb) => ev === 'exit' && cb(2)) };
      (spawn as jest.Mock).mockReturnValue(child);
      await expect(svc.up('/p','f','e','p')).rejects.toThrow('docker compose -f f up -d exited with 2');
    });

    it('rejects on spawn error', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('');
      (dotenv.parse as jest.Mock).mockReturnValue({});
      const child = { on: jest.fn((ev, cb) => ev === 'error' && cb(new Error('boom'))) };
      (spawn as jest.Mock).mockReturnValue(child);
      await expect(svc.up('/p','f','e','p')).rejects.toThrow('Failed to execute docker command: boom');
    });
  });
});
