import { NextJsDockerfileService } from './nextjs-dockerfile.service';
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

describe('NextJsDockerfileService', () => {
  let service: NextJsDockerfileService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    service = new NextJsDockerfileService();
    process.env = { ...OLD_ENV, DEPLOYMENT_HASH: 'nhash' };

    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('chooses the default template when output is null', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/p',
      installCommand: 'i',
      buildCommand: 'b',
      outputDirectory: 'o',
      output: null,
      runCommand: 'r',
    });
    expect((path.join as jest.Mock).mock.calls[0][2]).toBe('default.Dockerfile.ejs');
  });

  it('chooses the export template when output is "export"', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('TPL2');
    mockedEjs.render.mockReturnValueOnce('OUT2');
    await service.createDockerfile({
      projectPath: '/p',
      installCommand: 'i',
      buildCommand: 'b',
      outputDirectory: 'o',
      output: 'export',
      runCommand: 'r',
    });
    expect((path.join as jest.Mock).mock.calls[0][2]).toBe('static.Dockerfile.ejs');
  });

  it('chooses the standalone template when output is "standalone"', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('TPL3');
    mockedEjs.render.mockReturnValueOnce('OUT3');
    await service.createDockerfile({
      projectPath: '/p',
      installCommand: 'i',
      buildCommand: 'b',
      outputDirectory: 'o',
      output: 'standalone',
      runCommand: 'r',
    });
    expect((path.join as jest.Mock).mock.calls[0][2]).toBe('standalone.Dockerfile.ejs');
  });

  it('renders with correct variables including staticFolder and projectPath', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('T');
    mockedEjs.render.mockReturnValueOnce('X');
    await service.createDockerfile({
      projectPath: '/app',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      output: null,
      runCommand: 'npm start',
    });
    expect(mockedEjs.render).toHaveBeenCalledWith('T', {
      nodeVersion: '20',
      port: PORT,
      output: null,
      projectPath: '/app',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      runCommand: 'npm start',
      staticFolder: 'dist',
    });
  });

  it('maps ".next" outputDirectory to staticFolder "out"', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('T2');
    mockedEjs.render.mockReturnValueOnce('X2');
    await service.createDockerfile({
      projectPath: '/app',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      output: null,
      runCommand: 'npm start',
    });
    expect(mockedEjs.render).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ staticFolder: 'out' }),
    );
  });

  it('writes the Dockerfile with deployment hash in name', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('T3');
    mockedEjs.render.mockReturnValueOnce('X3');
    await service.createDockerfile({
      projectPath: '/myproj',
      installCommand: 'i',
      buildCommand: 'b',
      outputDirectory: 'o',
      output: null,
      runCommand: 'r',
    });
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      '/myproj/Dockerfile.nhash',
      'X3',
      'utf-8',
    );
  });

  it('throws HttpException on template read failure', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('enoent'));
    await expect(
      service.createDockerfile({
        projectPath: '/p',
        installCommand: 'i',
        buildCommand: 'b',
        outputDirectory: 'o',
        output: null,
        runCommand: 'r',
      }),
    ).rejects.toThrow(HttpException);
  });
});
