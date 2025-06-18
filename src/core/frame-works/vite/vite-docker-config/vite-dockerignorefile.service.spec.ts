import { ViteDockerIgnoreFileService } from './vite-dockerignorefile.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';

jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ViteDockerIgnoreFileService', () => {
  let service: ViteDockerIgnoreFileService;

  beforeEach(() => {
    service = new ViteDockerIgnoreFileService();
    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  it('reads .dockerignore template from correct path', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('IGNORE');
    await service.addDockerIgnoreFile({ projectPath: '/app' });
    expect(path.join).toHaveBeenCalledWith(
      expect.stringContaining('vite-docker-config'),
      'templates',
      '.dockerignore',
    );
    
    const ignorePath = path.join(__dirname, 'templates', '.dockerignore');    
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(ignorePath, 'utf-8');
  });

  it('writes .dockerignore into project root', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('IGNORE');
    await service.addDockerIgnoreFile({ projectPath: '/app' });
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      '/app/.dockerignore',
      'IGNORE',
      'utf-8',
    );
  });

  it('throws HttpException when readFile fails', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(
      service.addDockerIgnoreFile({ projectPath: '/app' }),
    ).rejects.toThrow(HttpException);
  });
});
