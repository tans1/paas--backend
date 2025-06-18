import { PythonScannerService } from './python-scanner.service';
import * as fs from 'fs';
import * as path from 'path';

describe('PythonScannerService', () => {
  let service: PythonScannerService;
  let existsSyncSpy: jest.SpyInstance;
  let readFileSpy: jest.SpyInstance;
  let readFileSyncSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new PythonScannerService();

    existsSyncSpy = jest.spyOn(fs, 'existsSync');
    readFileSpy = jest.spyOn(fs.promises, 'readFile');
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync');

    jest.clearAllMocks();
  });

  it('detects Python version from pyproject.toml [tool.poetry] and no dev group', async () => {
    // Simulate presence of pyproject.toml and poetry.lock
    existsSyncSpy.mockImplementation((filePath) =>
      filePath.endsWith('pyproject.toml') || filePath.endsWith('poetry.lock')
    );

    // Include [tool.poetry] header so manager is 'poetry'
    const pyprojectContent = `
[tool.poetry]
name = "myproj"
version = "0.1.0"

[tool.poetry.dependencies]
python = "^3.9"
`;
    readFileSpy.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('pyproject.toml')) {
        return pyprojectContent;
      }
      return '';
    });
    readFileSyncSpy.mockImplementation(() => pyprojectContent);

    const result = await service.scan({ projectPath: '/proj' });

    expect(result.pythonVersion).toBe('3.9');
    expect(result.depsType).toBe('poetry');
    expect(result.installFlags).toBe('');       // no dev group
    expect(result.hasLockFile).toBe(true);
  });

  it('detects "--without dev" installFlags when pyproject has dev group', async () => {
    existsSyncSpy.mockImplementation((filePath) =>
      filePath.endsWith('pyproject.toml') || filePath.endsWith('poetry.lock')
    );

    const devPyproject = `
[tool.poetry]
name = "myproj"
version = "0.1.0"

[tool.poetry.dependencies]
python = "3.10"

[tool.poetry.group.dev.dependencies]
pytest = "^6.0"
`;
    readFileSpy.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('pyproject.toml')) {
        return devPyproject;
      }
      return '';
    });
    readFileSyncSpy.mockImplementation(() => devPyproject);

    const result = await service.scan({ projectPath: '/proj' });

    expect(result.pythonVersion).toBe('3.10');
    expect(result.depsType).toBe('poetry');
    expect(result.installFlags).toBe('--without dev');
    expect(result.hasLockFile).toBe(true);
  });

  it('falls back to runtime.txt when pyproject.toml missing', async () => {
    existsSyncSpy.mockImplementation((filePath) =>
      filePath.endsWith('runtime.txt') || filePath.endsWith('requirements.txt')
    );
    readFileSpy.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('runtime.txt')) {
        return 'python-3.8.5';
      }
      return '';
    });
    readFileSyncSpy.mockImplementation(() => '');

    const result = await service.scan({ projectPath: '/proj' });

    expect(result.pythonVersion).toBe('3.8');
    expect(result.depsType).toBe('requirements');
    expect(result.installFlags).toBe('');
    expect(result.hasLockFile).toBe(true);
  });

  it('reads .python-version when others missing', async () => {
    existsSyncSpy.mockImplementation((filePath) =>
      filePath.endsWith('.python-version')
    );
    readFileSpy.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('.python-version')) {
        return '3.7';
      }
      return '';
    });
    readFileSyncSpy.mockImplementation(() => '');

    const result = await service.scan({ projectPath: '/proj' });

    expect(result.pythonVersion).toBe('3.7');
    expect(result.depsType).toBe('requirements');
    expect(result.installFlags).toBe('');
    expect(result.hasLockFile).toBe(false);
  });

  it('parses python from requirements.txt when only that exists', async () => {
    existsSyncSpy.mockImplementation((filePath) =>
      filePath.endsWith('requirements.txt')
    );
    readFileSpy.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('requirements.txt')) {
        return 'django\npython>=3.6\nrequests';
      }
      return '';
    });
    readFileSyncSpy.mockImplementation(() => '');

    const result = await service.scan({ projectPath: '/proj' });

    expect(result.pythonVersion).toBe('3.6');
    expect(result.depsType).toBe('requirements');
    expect(result.installFlags).toBe('');
    expect(result.hasLockFile).toBe(true);
  });

  it('defaults to 3.11 when no version files exist', async () => {
    existsSyncSpy.mockReturnValue(false);
    readFileSpy.mockRejectedValue(new Error('missing'));
    readFileSyncSpy.mockImplementation(() => '');

    const result = await service.scan({ projectPath: '/proj' });

    expect(result.pythonVersion).toBe('3.11');
    expect(result.depsType).toBe('requirements');
    expect(result.installFlags).toBe('');
    expect(result.hasLockFile).toBe(false);
  });

  it('detects pipenv when Pipfile exists', async () => {
    existsSyncSpy.mockImplementation((filePath) =>
      filePath.endsWith('Pipfile') || filePath.endsWith('Pipfile.lock')
    );
    readFileSpy.mockImplementation(async () => '');
    readFileSyncSpy.mockImplementation(() => '');

    const result = await service.scan({ projectPath: '/proj' });

    expect(result.depsType).toBe('pipenv');
    expect(result.hasLockFile).toBe(true);
  });
});
