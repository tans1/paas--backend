import { ReactProjectScannerService } from './react-project-scanner.service';
import * as fs from 'fs';
import * as path from 'path';
import { BundlerMap } from '../bundler.constants';

jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));
jest.mock('../bundler.constants', () => ({
  BundlerMap: {
    webpack: { dependancy: 'webpack', defaultBuildLocation: 'build/webpack' },
    vite:   { dependancy: 'vite',   defaultBuildLocation: 'build/vite'   },
  },
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ReactProjectScannerService', () => {
  let service: ReactProjectScannerService;

  beforeEach(() => {
    service = new ReactProjectScannerService();
    jest.clearAllMocks();
    mockedFs.promises = {
      readFile: jest.fn(),
    } as any;
  });

  it('reads package.json from the correct path', async () => {
   ( mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce(`{}`);
    await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      '/p/pkg.json',
      'utf-8'
    );
  });

  it('returns default nodeVersion 18 and defaultBuildLocation webpack when no engines or bundlers present', async () => {
   ( mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce(
      JSON.stringify({ dependencies: {}, devDependencies: {} })
    );

    const res = await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(res).toEqual({
      projectPath: '/p',
      nodeVersion: '18',
      defaultBuildLocation: 'build/webpack',
    });
  });

  it('picks up nodeVersion from engines.node if present', async () => {
   ( mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce(
      JSON.stringify({
        engines: { node: '14' },
        dependencies: {},
        devDependencies: {},
      })
    );

    const res = await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(res.nodeVersion).toBe('14');
  });

  it('chooses a bundler based on dependencies keys', async () => {
   ( mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce(
      JSON.stringify({
        dependencies: { vite: '^3.0.0' },
        devDependencies: {},
      })
    );

    const res = await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(res.defaultBuildLocation).toBe('build/vite');
  });

  it('chooses a bundler based on devDependencies keys', async () => {
   ( mockedFs.promises.readFile as jest.Mock)!.mockResolvedValueOnce(
      JSON.stringify({
        dependencies: {},
        devDependencies: { webpack: '^5.0.0' },
      })
    );

    const res = await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(res.defaultBuildLocation).toBe('build/webpack');
  });

  it('throws an Error when readFile fails', async () => {
   ( mockedFs.promises.readFile as jest.Mock)!.mockRejectedValueOnce(new Error('oops'));
    await expect(
      service.scan({ projectPath: '/p', configFile: 'pkg.json' })
    ).rejects.toThrow(
      'Failed to scan the react project. Please ensure the project path and config file are correct.'
    );
  });
});
