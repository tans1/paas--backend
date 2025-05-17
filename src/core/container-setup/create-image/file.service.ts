import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

@Injectable()
export class FileService {
  getRootFileNames(dir: string): string[] {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      return entries.map((entry) => entry.name);
    } catch (error) {
      throw new HttpException(
        `Error reading directory: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  parseGitignore(projectPath: string, files: string[]): string[] {
    try {
      const gitignorePath = path.join(projectPath, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      const ig = ignore().add(gitignoreContent);
      return files.filter((file) => !ig.ignores(file));
    } catch (error) {
      throw new HttpException(
        `Error reading .gitignore file: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
