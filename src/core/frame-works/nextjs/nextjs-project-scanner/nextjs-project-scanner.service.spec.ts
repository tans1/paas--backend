import { NextJsProjectScannerService } from './nextjs-project-scanner.service';
import loadConfig from 'next/dist/server/config';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import * as fsPromises from 'fs/promises';
import { join } from 'path';

jest.mock('next/dist/server/config', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('next/constants', () => ({
  __esModule: true,
  PHASE_PRODUCTION_BUILD: 'phase',
}));
jest.mock('fs/promises');

const mockedLoadConfig = loadConfig as jest.MockedFunction<typeof loadConfig>;
const mockedReadFile = (fsPromises.readFile as unknown) as jest.MockedFunction<
  typeof fsPromises.readFile
>;

describe('NextJsProjectScannerService', () => {
  let service: NextJsProjectScannerService;

  beforeEach(() => {
    service = new NextJsProjectScannerService();
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    mockedLoadConfig.mockReset();
    mockedReadFile.mockReset();
  });

  it('returns correct scan result on success', async () => {
    mockedLoadConfig.mockResolvedValueOnce({
      output: 'standalone',
      distDir: 'dist',
    } as any); // <-- cast to any to satisfy NextConfigComplete
    mockedReadFile.mockResolvedValueOnce(
      JSON.stringify({ engines: { node: '14' } }),
    );

    const res = await service.scan({ projectPath: '/nx' });

    expect(mockedLoadConfig).toHaveBeenCalledWith('phase', '/nx');

    const expectedPath = join('/nx', 'package.json');
    expect(mockedReadFile).toHaveBeenCalledWith(expectedPath, 'utf-8');
    expect(res).toEqual({
      projectPath: '/nx',
      nodeVersion: '14',
      output: 'standalone',
      distDir: 'dist',
    });
  });

  it('sets output null if missing in config', async () => {
    mockedLoadConfig.mockResolvedValueOnce({
      // no output property
      distDir: '_d',
    } as any);
    mockedReadFile.mockResolvedValueOnce(JSON.stringify({ engines: {} }));

    const res = await service.scan({ projectPath: '/nx2' });
    expect(res.output).toBeNull();
  });

  it('throws when loadConfig fails', async () => {
    mockedLoadConfig.mockRejectedValueOnce(new Error('badcfg'));
    await expect(service.scan({ projectPath: '/nx' })).rejects.toThrow(
      'Next.js validation failed: badcfg',
    );
  });

  it('throws when package.json read fails', async () => {
    mockedLoadConfig.mockResolvedValueOnce({ output: 'export', distDir: 'd' } as any);
    mockedReadFile.mockRejectedValueOnce(new Error('enoent'));

    await expect(service.scan({ projectPath: '/nx' })).rejects.toThrow(
      'Next.js validation failed: Failed to read package.json: enoent',
    );
  });
});
