import { NextJsDockerIgnoreFileService } from './nextjs-dockerignorefile.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';

jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('NextJsDockerIgnoreFileService', () => {
  let service: NextJsDockerIgnoreFileService;

  beforeEach(() => {
    service = new NextJsDockerIgnoreFileService();
    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  it('reads .dockerignore template from correct path', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('CONTENT');
    await service.addDockerIgnoreFile({ projectPath: '/app' });
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      expect.stringContaining('templates/.dockerignore'),
      'utf-8',
    );
  });

  it('writes the .dockerignore file into project root', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('C');
    await service.addDockerIgnoreFile({ projectPath: '/app' });
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      '/app/.dockerignore',
      'C',
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
