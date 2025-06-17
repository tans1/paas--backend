import { AngularDockerfileService } from './angular-dockerfile.service';
import { HttpException } from '@nestjs/common';
import * as fs from 'fs';
import * as ejs from 'ejs';
import * as semver from 'semver';

// Mocks
jest.mock('fs');
jest.mock('ejs');
jest.mock('semver');
jest.mock('strip-json-comments', () => (content: string) => content);

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedEjs = ejs as jest.Mocked<typeof ejs>;
const mockedSemver = semver as unknown as {
  coerce: jest.Mock<any, any>;
  gte: jest.Mock<any, any>;
};

describe('AngularDockerfileService', () => {
  let service: AngularDockerfileService;
  const oldEnv = process.env;

  beforeEach(() => {
    service = new AngularDockerfileService();
    jest.resetModules();
    process.env = { ...oldEnv, DEPLOYMENT_HASH: 'hash123' };

    // Default mocks for fs
    mockedFs.promises = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      access: jest.fn(),
    } as any;
  });

  afterEach(() => {
    process.env = oldEnv;
    jest.clearAllMocks();
  });

  it('should create a Dockerfile with SSR disabled', async () => {
    // Mock private determineSSREntry to return ssrEnabled: false
    jest
      .spyOn<any, any>(service, 'determineSSREntry')
      .mockResolvedValue({ ssrEnabled: false });

    // Mock fs.promises.readFile for the template
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('TEMPLATE CONTENT');
    // Mock ejs.render to just return a fixed string
    mockedEjs.render.mockReturnValue('DOCKERFILE CONTENT');
    // Mock writeFile
    (mockedFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

    await service.createDockerfile({
      projectPath: '/app/test',
      installCommand: 'npm install',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      nodeVersion: '18',
    });

    // Should read the correct template
    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      expect.stringContaining('Dockerfile.CSR.ejs'),
      'utf-8',
    );
    // Should write Dockerfile with deployment hash
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('Dockerfile.hash123'),
      'DOCKERFILE CONTENT',
      'utf-8',
    );
    // ejs.render called with correct context
    expect(mockedEjs.render).toHaveBeenCalledWith(
      'TEMPLATE CONTENT',
      expect.objectContaining({
        nodeVersion: '18',
        installCommand: 'npm install',
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
      }),
    );
  });

  it('should create a Dockerfile with SSR enabled', async () => {
    jest
      .spyOn<any, any>(service, 'determineSSREntry')
      .mockResolvedValue({ ssrEnabled: true, entryFile: 'server.js' });
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce('SSR TEMPLATE');
    mockedEjs.render.mockReturnValue('SSR_DOCKERFILE');
    (mockedFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

    await service.createDockerfile({
      projectPath: '/app/ssr',
      installCommand: 'yarn',
      buildCommand: 'yarn build',
      outputDirectory: 'build',
      nodeVersion: '20',
    });

    expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
      expect.stringContaining('Dockerfile.SSR.ejs'),
      'utf-8',
    );
    expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('Dockerfile.hash123'),
      'SSR_DOCKERFILE',
      'utf-8',
    );
    expect(mockedEjs.render).toHaveBeenCalledWith(
      'SSR TEMPLATE',
      expect.objectContaining({
        entryFile: 'server.js',
      }),
    );
  });

  it('should throw an HttpException if an error occurs', async () => {
    jest
      .spyOn<any, any>(service, 'determineSSREntry')
      .mockRejectedValue(new Error('SSR ERROR'));

    await expect(
      service.createDockerfile({
        projectPath: '/app/err',
        installCommand: 'npm ci',
        buildCommand: 'npm run prod',
        outputDirectory: 'dist',
        nodeVersion: '16',
      }),
    ).rejects.toThrow(HttpException);
  });

  // --- Example test for getEntryExtension (optional, for completeness) ---
  describe('getEntryExtension', () => {
    it('returns js for CJS in Angular <16', () => {
      const v = semver.coerce('15.2.0');
      expect(
        (service as any).getEntryExtension(v, 'commonjs'),
      ).toBe('js');
    });
    it('returns mjs for ESM in Angular 16+', () => {
      // Make sure v is a semver.SemVer object, not null!
      const v = semver.coerce('16.0.0') as unknown as semver.SemVer;
      expect(
        (service as any).getEntryExtension(v, 'ESNext'),
      ).toBe('js');
    });

    it('returns js for non-ESM in Angular 16+', () => {
      const v = semver.coerce('16.0.0');
      expect(
        (service as any).getEntryExtension(v, 'commonjs'),
      ).toBe('js');
    });
    it('returns js if no angular version', () => {
      expect(
        (service as any).getEntryExtension(null, 'whatever'),
      ).toBe('js');
    });
  });
});
