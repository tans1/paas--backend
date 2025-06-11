import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PythonScannerService {
  constructor() {}

  private async detectPythonVersion(projectPath: string): Promise<string> {
    const defaultVersion = '3.11';
    const versionSources = [
      {
        file: 'pyproject.toml',
        patterns: [
          {
            section: /\[tool\.poetry\.dependencies\][\s\S]*?python\s*=\s*["']\^?(\d+\.\d+)/im,
            extract: (match: RegExpMatchArray) => match[1]
          },
          {
            section: /requires-python\s*=\s*["']>=?(\d+\.\d+)/im,
            extract: (match: RegExpMatchArray) => match[1]
          }
        ]
      },
      {
        file: 'runtime.txt',
        patterns: [
          {
            section: /^(?:python-)?(\d+\.\d+)/m,
            extract: (match: RegExpMatchArray) => match[1]
          }
        ]
      },
      {
        file: '.python-version',
        patterns: [
          {
            section: /^(\d+\.\d+)/m,
            extract: (match: RegExpMatchArray) => match[1]
          }
        ]
      },
      {
        file: 'requirements.txt',
        patterns: [
          {
            section: /^python\s*[=<>~]+\s*(\d+\.\d+)/im,
            extract: (match: RegExpMatchArray) => match[1]
          }
        ]
      }
    ];
  
    try {
      for (const source of versionSources) {
        const filePath = path.join(projectPath, source.file);
        if (!fs.existsSync(filePath)) continue;
  
        const content = await fs.promises.readFile(filePath, 'utf-8');
        
        for (const pattern of source.patterns) {
          const match = content.match(pattern.section);
          if (match) {
            const version = pattern.extract(match);
            if (this.isValidPythonVersion(version)) {
              return version;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Python version detection error: ${error.message}`);
    }
  
    return defaultVersion;
  }
  
  private isValidPythonVersion(version: string): boolean {
    if (!/^\d+\.\d+$/.test(version)) return false;
    
    const [major, minor] = version.split('.').map(Number);
    return major === 3 && minor >= 6 && minor <= 13; // Supports 3.6-3.13
  }

  private detectDependencyManager(projectPath: string): 'poetry' | 'pipenv' | 'requirements' {
    if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
      const content = fs.readFileSync(path.join(projectPath, 'pyproject.toml'), 'utf-8');
      return content.includes('[tool.poetry]') ? 'poetry' : 'requirements';
    }
    if (fs.existsSync(path.join(projectPath, 'Pipfile'))) {
      return 'pipenv';
    }
    return 'requirements';
  }

  private detectInstallFlags(projectPath: string, depsType: string): string {
    if (depsType === 'poetry') {
      const content = fs.readFileSync(path.join(projectPath, 'pyproject.toml'), 'utf-8');
      const hasDevDeps = content.includes('[tool.poetry.group.dev.dependencies]');
      return hasDevDeps ? '--without dev' : '';
    }
    return '';
  }

  async scan(payload: { projectPath: string }) {
    const { projectPath } = payload;

    try {
      const [pythonVersion, depsType] = await Promise.all([
        this.detectPythonVersion(projectPath),
        this.detectDependencyManager(projectPath),
      ]);

      const installFlags = this.detectInstallFlags(projectPath, depsType);

      return {
        projectPath,
        pythonVersion,
        depsType,
        installFlags,
        hasLockFile: fs.existsSync(
          path.join(projectPath, 
            depsType === 'poetry' ? 'poetry.lock' :
            depsType === 'pipenv' ? 'Pipfile.lock' : 'requirements.txt'
          )
        )
      };
    } catch (error) {
      console.error('Error scanning Python project:', error.message);
      throw error;
    }
  }
}
