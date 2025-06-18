import { AngularProjectScannerService } from './angular-project-scanner.service';
import * as fs from 'fs';
import * as path from 'path';

describe('AngularProjectScannerService', () => {
  let service: AngularProjectScannerService;
  let testDir: string;

  beforeEach(() => {
    service = new AngularProjectScannerService();
    // Create a temp directory for the test
    testDir = fs.mkdtempSync(path.join(__dirname, 'temp-'));
  });

  afterEach(() => {
    // Cleanup: remove temp dir and its files
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  function writeTestFiles({
    packageJson = { engines: { node: '20' } },
    angularJson = {
      defaultProject: 'app',
      projects: {
        app: {
          architect: {
            build: { options: { outputPath: 'dist/app' } },
          },
        },
      },
    },
  } = {}) {
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson)
    );
    fs.writeFileSync(
      path.join(testDir, 'angular.json'),
      JSON.stringify(angularJson)
    );
  }

  it('should scan and return correct project info (happy path)', async () => {
    writeTestFiles(); // defaults are fine

    const result = await service.scan({
      projectPath: testDir,
      configFile: 'package.json',
    });

    expect(result).toEqual({
      projectPath: testDir,
      nodeVersion: '20',
      defaultBuildLocation: 'dist/app',
    });
  });

  it('should use default node version if not specified', async () => {
    writeTestFiles({ packageJson: {
      engines: undefined
    } });

    const result = await service.scan({
      projectPath: testDir,
      configFile: 'package.json',
    });

    expect(result.nodeVersion).toBe('18');
  });

  it('should fallback to first project if no defaultProject', async () => {
    writeTestFiles({
      angularJson: {
        defaultProject: 'app',
        projects: {
          app: {
            architect: {
              build: { options: { outputPath: 'dist/foo' } },
            },
          },
        },
      },
    });

    const result = await service.scan({
      projectPath: testDir,
      configFile: 'package.json',
    });

    expect(result.defaultBuildLocation).toBe('dist/foo');
  });

  it('should throw and log error if package.json cannot be read', async () => {
    // Don't create package.json

    // Silence logger
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    await expect(
      service.scan({
        projectPath: testDir,
        configFile: 'package.json',
      }),
    ).rejects.toThrow(
      'Failed to read package.json. Please ensure the project path and config file are correct.'
    );
    expect(service['logger'].error).toHaveBeenCalled();
  });
});
