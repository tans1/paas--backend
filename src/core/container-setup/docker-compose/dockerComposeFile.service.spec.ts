import { DockerComposeFileService } from './dockerComposeFile.service';
import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';

jest.mock('path', () => ({ join: jest.fn((...parts) => parts.join('/')) }));
jest.mock('ejs', () => ({ render: jest.fn() }));

describe('DockerComposeFileService', () => {
  let svc: DockerComposeFileService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    svc = new DockerComposeFileService();
    process.env.DEPLOYMENT_HASH = 'HASH';
    process.env.DOCKER_USERNAME = 'user';

    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('TPL');
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...OLD_ENV };
  });

  it('creates file when env exists', async () => {
    // First call: template path; second: env file path
    (path.join as jest.Mock)
      .mockReturnValueOnce('/tmpl')
      .mockReturnValueOnce('/proj/proj.ext.env')
      .mockReturnValueOnce('/proj/docker-compose.HASH.yml');

    (ejs.render as jest.Mock).mockReturnValue('OUT');

    const [img, ctr, file] = await svc.createDockerComposeFile(
      '/proj', 'proj', 'url', 'ext', 3000, 'Df'
    );

    expect(path.join).toHaveBeenCalledWith(expect.any(String), 'templates', 'docker-compose.yml.ejs');
    expect(fs.promises.readFile).toHaveBeenCalledWith('/tmpl', 'utf-8');
    expect(ejs.render).toHaveBeenCalledWith('TPL', expect.objectContaining({
      projectName: 'proj',
      deploymentUrl: 'url',
      includeEnvFile: true,
      envFileName: 'proj.ext.env',
      dockerFile: 'Df',
      imageName: 'user/proj',
      containerName: 'proj',
      PORT: 3000,
    }));
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/proj/docker-compose.HASH.yml',
      'OUT',
      'utf-8',
    );
    expect(img).toBe('user/proj:ext');
    expect(ctr).toBe('proj-ext');
    expect(file).toBe('docker-compose.HASH.yml');
  });

  it('omits env when file missing and uses default dockerFile', async () => {
    (path.join as jest.Mock)
      .mockReturnValueOnce('/tmpl')
      .mockReturnValueOnce('/proj/proj.ext.env')
      .mockReturnValueOnce('/proj/docker-compose.undefined.yml');
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    delete process.env.DEPLOYMENT_HASH;

    (fs.promises.readFile as jest.Mock).mockResolvedValue('TPL2');
    (ejs.render as jest.Mock).mockReturnValue('OUT2');

    const [img, ctr, file] = await svc.createDockerComposeFile(
      '/proj', 'proj', 'url', 'ext'
    );

    expect(ejs.render).toHaveBeenCalledWith('TPL2', expect.objectContaining({
      includeEnvFile: false,
      dockerFile: 'Dockerfile.undefined',
    }));
    // imageName uses DOCKER_USERNAME
    expect(img).toBe('user/proj:ext');
    expect(ctr).toBe('proj-ext');
    expect(file).toBe('docker-compose.undefined.yml');
  });

  it('rethrows on read failure', async () => {
    jest.spyOn(fs.promises, 'readFile').mockRejectedValue(new Error('bad'));
    await expect(
      svc.createDockerComposeFile('/p', 'n', 'u', 'e')
    ).rejects.toThrow('bad');
  });
});
