import { ViteDockerfileService } from './vite-dockerfile.service';
import * as fs from 'fs';
import * as ejs from 'ejs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { PORT } from '../constants';

jest.mock('fs');
jest.mock('ejs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedEjs = ejs as jest.Mocked<typeof ejs>;

describe('ViteDockerfileService', () => {
  let service: ViteDockerfileService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    service = new ViteDockerfileService();
    process.env = { ...OLD_ENV, DEPLOYMENT_HASH: 'viteHash' };
    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('reads template from the correct path', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/proj',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      nodeVersion: '18',
    });
    expect(path.join).toHaveBeenCalledWith(
      expect.stringContaining('vite-docker-config'),
      'templates',
      'Dockerfile.ejs',
    );
    const templatePath = path.join(__dirname, 'templates', 'Dockerfile.ejs');
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(templatePath, 'utf-8');
  });

  it('renders with correct context including PORT', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/proj',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      nodeVersion: '18',
    });
    expect(mockedEjs.render).toHaveBeenCalledWith('TPL', {
      nodeVersion: '18',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      PORT: PORT,
    });
  });

  it('writes Dockerfile.<hash> in project directory', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/proj',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
    });
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      '/proj/Dockerfile.viteHash',
      'OUT',
      'utf-8',
    );
  });

  it('defaults nodeVersion to "16" if omitted', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/proj',
      installCommand: 'i',
      buildCommand: 'b',
      outputDirectory: 'o',
    });
    expect(mockedEjs.render).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ nodeVersion: '16' }),
    );
  });

  it('throws HttpException when readFile fails', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockRejectedValueOnce(new Error('nope'));
    await expect(
      service.createDockerfile({
        projectPath: '/proj',
        installCommand: 'i',
        buildCommand: 'b',
        outputDirectory: 'o',
      }),
    ).rejects.toThrow(HttpException);
  });
});
