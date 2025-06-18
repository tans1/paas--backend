import { PythonDockerfileService } from './python-dockerfile.service';
import * as fs from 'fs';
import * as ejs from 'ejs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { PORT } from '../constants';
import * as runUtils from './run-command.utils';

jest.mock('fs');
jest.mock('ejs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));

describe('PythonDockerfileService', () => {
  let service: PythonDockerfileService;
  let readFile: jest.Mock;
  let writeFile: jest.Mock;
  let modifySpy: jest.SpyInstance;

  const OLD_ENV = process.env;

  beforeEach(() => {
    service = new PythonDockerfileService();
    process.env = { ...OLD_ENV, DEPLOYMENT_HASH: 'pyHash' };

    // stub out fs.promises
    readFile = jest.fn();
    writeFile = jest.fn();
    (fs.promises as any) = { readFile, writeFile };

    // spy on modifyRunCommand
    modifySpy = jest.spyOn(runUtils, 'modifyRunCommand');

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it('reads the EJS template from the correct path', async () => {
    readFile.mockResolvedValueOnce('TEMPLATE');
    (ejs.render as jest.Mock).mockReturnValueOnce('CONTENT');

    await service.createDockerfile({
      projectPath: '/app',
      pythonVersion: '3.9',
      runCommand: 'cmd',
      depsType: 'pip',
      installFlags: '',
      hasLockFile: false,
    });

    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining('templates/Dockerfile.ejs'),
      'utf-8'
    );
  });

  it('renders with modified runCommand and correct context', async () => {
    readFile.mockResolvedValueOnce('TPL2');
    (ejs.render as jest.Mock).mockReturnValueOnce('CONTENT2');

    await service.createDockerfile({
      projectPath: '/app',
      pythonVersion: '3.8',
      runCommand: 'cmd --port=1234',
      depsType: 'pipenv',
      installFlags: '--flag',
      hasLockFile: true,
    });

    expect(modifySpy).toHaveBeenCalledWith('cmd --port=1234');
    expect(ejs.render).toHaveBeenCalledWith('TPL2', {
      pythonVersion: '3.8',
      PORT,
      runCommand: runUtils.modifyRunCommand('cmd --port=1234'),
      depsType: 'pipenv',
      installFlags: '--flag',
      hasLockFile: true,
    });
  });

  it('writes the Dockerfile with deployment hash in name', async () => {
    readFile.mockResolvedValueOnce('TPL3');
    (ejs.render as jest.Mock).mockReturnValueOnce('CONTENT3');

    await service.createDockerfile({
      projectPath: '/app',
      pythonVersion: '3.7',
      runCommand: 'run',
      depsType: 'pip',
      installFlags: '',
      hasLockFile: false,
    });

    expect(writeFile).toHaveBeenCalledWith(
      '/app/Dockerfile.pyHash',
      'CONTENT3',
      'utf-8'
    );
  });

  it('throws HttpException when template read fails', async () => {
    readFile.mockRejectedValueOnce(new Error('fail'));
    await expect(
      service.createDockerfile({
        projectPath: '/app',
        pythonVersion: '3.9',
        runCommand: 'run',
        depsType: 'pip',
        installFlags: '',
        hasLockFile: false,
      })
    ).rejects.toThrow(HttpException);
  });
});
