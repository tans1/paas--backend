import { DockerfileScannerService } from './dockerfile-scanner.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('DockerfileScannerService', () => {
  let service: DockerfileScannerService;

  beforeEach(() => {
    service = new DockerfileScannerService();
    mockedFs.promises = { readFile: jest.fn() } as any;
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  it('extracts PORT from a valid Dockerfile', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce(
      'FROM node\nEXPOSE 3000\nCMD ["npm","start"]'
    );

    const result = await service.scan({ projectPath: '/proj' });

    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      '/proj/Dockerfile',
      'utf-8'
    );
    expect(result).toEqual({ PORT: 3000 });
    expect(service['logger'].log).toHaveBeenCalledWith(
      'Successfully detected PORT 3000 from Dockerfile'
    );
  });

  it('throws if no EXPOSE line is found', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce('FROM node');

    await expect(service.scan({ projectPath: '/proj' })).rejects.toThrow(
      'Failed to process Dockerfile: No PORT found in Dockerfile'
    );
    expect(service['logger'].error).toHaveBeenCalledWith(
      'Dockerfile scan failed: No PORT found in Dockerfile'
    );
  });

  it('throws if reading the file fails', async () => {
    (mockedFs.promises.readFile as jest.Mock)!.mockRejectedValueOnce(new Error('enoent'));

    await expect(
      service.scan({ projectPath: '/proj', configFile: 'MyDockerfile' })
    ).rejects.toThrow('Failed to process Dockerfile: enoent');
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      '/proj/MyDockerfile',
      'utf-8'
    );
    expect(service['logger'].error).toHaveBeenCalledWith(
      'Dockerfile scan failed: enoent'
    );
  });
});
