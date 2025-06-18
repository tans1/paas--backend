import { CRADockerfileService } from './cra-dockerfile.service';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { HttpException } from '@nestjs/common';
import { PORT } from '../constants';
import { join } from 'path';

jest.mock('fs');
jest.mock('ejs');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedEjs = ejs as jest.Mocked<typeof ejs>;

describe('CRADockerfileService', () => {
  let service: CRADockerfileService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    service = new CRADockerfileService();
    process.env = { ...OLD_ENV, DEPLOYMENT_HASH: 'craHash' };

    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('reads the EJS template from correct path', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('TEMPLATE');
    mockedEjs.render.mockReturnValueOnce('OUTPUT');
    await service.createDockerfile({
      projectPath: '/my/cra',
      installCommand: 'npm install',
      buildCommand: 'npm run build',
      outputDirectory: 'build',
      nodeVersion: '14',
    });
    const templatePath = join(__dirname, 'templates', 'Dockerfile.ejs');
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      templatePath,
      'utf-8',
    );
  });

  it('renders template with provided config and PORT', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/my/cra',
      installCommand: 'npm install',
      buildCommand: 'npm run build',
      outputDirectory: 'build',
      nodeVersion: '14',
    });

    expect(mockedEjs.render).toHaveBeenCalledWith('TPL', {
      nodeVersion: '14',
      installCommand: 'npm install',
      buildCommand: 'npm run build',
      outputDirectory: 'build',
      PORT: PORT,
    });
  });

  it('writes Dockerfile.<hash> to project directory', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('TPL');
    mockedEjs.render.mockReturnValueOnce('OUT');
    await service.createDockerfile({
      projectPath: '/my/cra',
      installCommand: 'npm install',
      buildCommand: 'npm run build',
      outputDirectory: 'build',
    });
    const outputPath = join('/my/cra', 'Dockerfile.craHash');
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      outputPath,
      'OUT',
      'utf-8',
    );
  });

  it('defaults nodeVersion to "16" when omitted', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('T');
    mockedEjs.render.mockReturnValueOnce('O');
    await service.createDockerfile({
      projectPath: '/p',
      installCommand: 'i',
      buildCommand: 'b',
      outputDirectory: 'o',
    });

    expect(mockedEjs.render).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ nodeVersion: '16' }),
    );
  });

  it('throws HttpException on readFile failure', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(
      service.createDockerfile({
        projectPath: '/p',
        installCommand: 'i',
        buildCommand: 'b',
        outputDirectory: 'o',
      }),
    ).rejects.toThrow(HttpException);
  });
});
