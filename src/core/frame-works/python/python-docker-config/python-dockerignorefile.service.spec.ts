import { PythonDockerIgnoreFileService } from './python-dockerignorefile.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';

jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));

describe('PythonDockerIgnoreFileService', () => {
  let service: PythonDockerIgnoreFileService;
  let readFile: jest.Mock;
  let writeFile: jest.Mock;

  beforeEach(() => {
    service = new PythonDockerIgnoreFileService();
    readFile = jest.fn();
    writeFile = jest.fn();
    // override fs.promises
    (fs.promises as any) = { readFile, writeFile };
    jest.clearAllMocks();
  });

  it('reads .dockerignore template from correct path', async () => {
    readFile.mockResolvedValueOnce('IGNORE');
    await service.addDockerIgnoreFile({ projectPath: '/proj' });

    // First join should be for the template file
    expect(path.join).toHaveBeenCalledWith(
      expect.stringContaining('python-docker-config'),
      'templates',
      '.dockerignore',
    );
    // Grab the returned template path
    const templatePath = (path.join as jest.Mock).mock.results[0].value;
    expect(readFile).toHaveBeenCalledWith(templatePath, 'utf-8');
  });

  it('writes .dockerignore into project root', async () => {
    readFile.mockResolvedValueOnce('CONTENT');
    await service.addDockerIgnoreFile({ projectPath: '/proj' });

    // Second join should be for output path
    expect(path.join).toHaveBeenCalledWith('/proj', '.dockerignore');
    const outputPath = (path.join as jest.Mock).mock.results[1].value;
    expect(writeFile).toHaveBeenCalledWith(outputPath, 'CONTENT', 'utf-8');
  });

  it('throws HttpException when readFile fails', async () => {
    readFile.mockRejectedValueOnce(new Error('fail'));
    await expect(
      service.addDockerIgnoreFile({ projectPath: '/proj' }),
    ).rejects.toThrow(HttpException);
  });
});
