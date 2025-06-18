import { CRADockerIgnoreFileService } from './cra-dockerignorefile.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { join } from 'path';

jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('CRADockerIgnoreFileService', () => {
  let service: CRADockerIgnoreFileService;

  beforeEach(() => {
    service = new CRADockerIgnoreFileService();
    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  it('reads .dockerignore template from correct path', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('IGNORE_CONTENT');
    await service.addDockerIgnoreFile({ projectPath: '/app' });

    const templatePath = join(__dirname, 'templates', '.dockerignore');
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      templatePath,
      'utf-8',
    );
  });

  it('writes .dockerignore into the project root', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('C');
    await service.addDockerIgnoreFile({ projectPath: '/app' });

    const outputPath = join('/app', '.dockerignore');
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      outputPath,
      'C',
      'utf-8',
    );
  });

  it('throws HttpException on readFile failure', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('oops'));
    await expect(
      service.addDockerIgnoreFile({ projectPath: '/app' }),
    ).rejects.toThrow(HttpException);
  });
});
