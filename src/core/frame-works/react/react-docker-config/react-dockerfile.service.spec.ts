import { ReactDockerfileService } from './react-dockerfile.service';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { HttpException } from '@nestjs/common';
import { PORT } from '../constants';
import { join } from 'path';

jest.mock('fs');
jest.mock('ejs');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedEjs = ejs as jest.Mocked<typeof ejs>;

describe('ReactDockerfileService', () => {
  let service: ReactDockerfileService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    service = new ReactDockerfileService();
    process.env = { ...OLD_ENV, DEPLOYMENT_HASH: 'hash321' };

    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('reads the EJS template from the correct path', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/proj',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      nodeVersion: '20',
    });

    const templatePath = join(__dirname, 'templates', 'Dockerfile.ejs');
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      templatePath,
      'utf-8'
    );
  });

  it('renders the template with the provided config and PORT', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/proj',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      nodeVersion: '20',
    });

    expect(mockedEjs.render).toHaveBeenCalledWith('TPL', {
      nodeVersion: '20',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      PORT: PORT,
    });
  });

  it('writes the rendered Dockerfile to disk using DEPLOYMENT_HASH', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/proj',
      installCommand: 'npm i',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      nodeVersion: '20',
    });

    const expectedPath = join('/proj', 'Dockerfile.hash321');
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      expectedPath,
      'OUT',
      'utf-8'
    );
  });

  it('defaults nodeVersion to "16" if not provided', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/p',
      installCommand: 'i',
      buildCommand: 'b',
      outputDirectory: 'o',
    });

    expect(mockedEjs.render).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ nodeVersion: '16' })
    );
  });

  it('throws HttpException when readFile fails', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockRejectedValueOnce(new Error('fail'));
    await expect(
      service.createDockerfile({
        projectPath: '/p',
        installCommand: 'i',
        buildCommand: 'b',
        outputDirectory: 'o',
      })
    ).rejects.toThrow(HttpException);
  });
});
