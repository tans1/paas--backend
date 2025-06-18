import { CRAProjectScannerService } from './cra-project-scanner.service';
import * as fs from 'fs';
import * as path from 'path';
import { BundlerMap } from '../bundler.constants';

jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...parts: string[]) => parts.join('/')),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('CRAProjectScannerService', () => {
  let service: CRAProjectScannerService;

  beforeEach(() => {
    service = new CRAProjectScannerService();
    mockedFs.promises = { readFile: jest.fn() } as any;
    jest.clearAllMocks();
  });

  it('reads package.json from correct path', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('{}');
    await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      '/p/pkg.json',
      'utf-8',
    );
  });

  it('returns defaults when no engines or bundler deps exist', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    const res = await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(res).toEqual({
      projectPath: '/p',
      nodeVersion: '18',
      defaultBuildLocation: BundlerMap.webpack.defaultBuildLocation,
    });
  });

  it('uses engines.node if specified', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        engines: { node: '12' },
        dependencies: {},
        devDependencies: {},
      }),
    );
    const res = await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(res.nodeVersion).toBe('12');
  });

  it('detects bundler from dependencies', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ dependencies: { vite: '^2.0' }, devDependencies: {} }),
    );
    const res = await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(res.defaultBuildLocation).toBe(BundlerMap.vite.defaultBuildLocation);
  });

  it('detects bundler from devDependencies', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ dependencies: {}, devDependencies: { parcel: '^1.0' } }),
    );
    const res = await service.scan({ projectPath: '/p', configFile: 'pkg.json' });
    expect(res.defaultBuildLocation).toBe(BundlerMap.parcel.defaultBuildLocation);
  });

  it('throws Error when readFile fails', async () => {
    (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('bad'));
    await expect(
      service.scan({ projectPath: '/p', configFile: 'pkg.json' }),
    ).rejects.toThrow(
      'Failed to scan the create react app project. Please ensure the project path and config file are correct.',
    );
  });
});
