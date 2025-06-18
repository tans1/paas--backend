import { NestJsDockerfileService } from './nestjs-dockerfile.service';
import { HttpException } from '@nestjs/common';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { join } from 'path';

jest.mock('fs');
jest.mock('ejs');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedEjs = ejs as jest.Mocked<typeof ejs>;

describe('NestJsDockerfileService', () => {
  let service: NestJsDockerfileService;
  const oldEnv = process.env;

  beforeEach(() => {
    service = new NestJsDockerfileService();
    process.env = { ...oldEnv, DEPLOYMENT_HASH: 'testhash' };

    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  const config = {
    projectPath: '/some/project',
    nodeVersion: '18',
    installCommand: 'yarn',
    buildCommand: 'yarn build',
    outputDirectory: 'dist',
    runCommand: 'node main.js',
  };

  it('creates a Dockerfile from the template', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('TEMPLATE');
    mockedEjs.render.mockReturnValueOnce('DOCKERFILE_CONTENT');
    (mockedFs.promises.writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    await service.createDockerfile(config);

    // Reads the template
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      expect.stringContaining('Dockerfile.ejs'),
      'utf-8'
    );
    // Renders using ejs
    expect(mockedEjs.render).toHaveBeenCalledWith('TEMPLATE', {
      nodeVersion: '18',
      PORT: expect.any(Number), // From constants
      installCommand: 'yarn',
      buildCommand: 'yarn build',
      outputDirectory: 'dist',
      runCommand: 'node main.js',
    });
    // Writes Dockerfile to disk
    const expectedPath = join('/some/project', 'Dockerfile.testhash');
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      expectedPath,
      'DOCKERFILE_CONTENT',
      'utf-8'
    );
  });

  it('throws HttpException if something fails', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('fail!'));
    await expect(service.createDockerfile(config)).rejects.toThrow(HttpException);
  });
});
