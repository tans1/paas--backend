import { VueDockerfileService } from './vue-dockerfile.service';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { HttpException } from '@nestjs/common';
import { PORT } from '../constants';
import { join } from 'path';

jest.mock('fs');
jest.mock('ejs');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedEjs = ejs as jest.Mocked<typeof ejs>;

describe('VueDockerfileService', () => {
  let service: VueDockerfileService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    service = new VueDockerfileService();
    process.env = { ...OLD_ENV, DEPLOYMENT_HASH: 'vh123' };
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
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('tpl');
    mockedEjs.render.mockReturnValueOnce('out');
    await service.createDockerfile({
      projectPath: '/vue',
      installCommand: 'yarn',
      buildCommand: 'yarn build',
      outputDirectory: 'dist',
      nodeVersion: '17',
    });
    const templatePath = join(__dirname,'templates', 'Dockerfile.ejs');
    expect((mockedFs.promises.readFile as jest.Mock)).toHaveBeenCalledWith(
      templatePath,
      'utf-8',
    );
  });

  it('renders template with provided vars and PORT', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('tpl');
    mockedEjs.render.mockReturnValueOnce('out');
    await service.createDockerfile({
      projectPath: '/vue',
      installCommand: 'yarn',
      buildCommand: 'yarn build',
      outputDirectory: 'dist',
      nodeVersion: '17',
    });
    expect(mockedEjs.render).toHaveBeenCalledWith('tpl', {
      nodeVersion: '17',
      installCommand: 'yarn',
      buildCommand: 'yarn build',
      outputDirectory: 'dist',
      PORT: PORT,
    });
  });

  it('writes Dockerfile.<hash> in projectPath', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('tpl');
    mockedEjs.render.mockReturnValueOnce('out');
    await service.createDockerfile({
      projectPath: '/vue',
      installCommand: 'yarn',
      buildCommand: 'yarn build',
      outputDirectory: 'dist',
    });
    const outputPath = join('/vue', 'Dockerfile.vh123');
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      outputPath,
      'out',
      'utf-8',
    );
  });

  it('defaults nodeVersion to "16" if omitted', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('tpl');
    mockedEjs.render.mockReturnValueOnce('out');
    await service.createDockerfile({
      projectPath: '/vue',
      installCommand: 'i',
      buildCommand: 'b',
      outputDirectory: 'o',
    });
    expect(mockedEjs.render).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ nodeVersion: '16' }),
    );
  });

  it('throws HttpException if readFile errors', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockRejectedValueOnce(new Error('err'));
    await expect(
      service.createDockerfile({
        projectPath: '/vue',
        installCommand: 'i',
        buildCommand: 'b',
        outputDirectory: 'o',
      }),
    ).rejects.toThrow(HttpException);
  });
});
