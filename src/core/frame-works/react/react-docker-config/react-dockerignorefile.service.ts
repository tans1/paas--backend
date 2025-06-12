import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class ReactDockerIgnoreFileService {
  constructor() {}

  async addDockerIgnoreFile(projectConfig: {
    projectPath: string;
  }): Promise<void> {
    if (!projectConfig?.projectPath) {
      throw new HttpException(
        'Project path is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { projectPath } = projectConfig;

    try {
      // Ensure the project directory exists
      await fs.promises.access(projectPath);

      const templateDockerIgnoreFilePath = path.join(
        __dirname,
        'templates',
        '.dockerignore',
      );

      // Ensure the template file exists
      await fs.promises.access(templateDockerIgnoreFilePath);

      const dockerIgnoreFileContent = await fs.promises.readFile(templateDockerIgnoreFilePath, 'utf-8');
      const dockerIgnoreFilePath = path.join(projectPath, '.dockerignore');
      
      await fs.promises.writeFile(dockerIgnoreFilePath, dockerIgnoreFileContent, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new HttpException(
          `File or directory not found: ${error.message}`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      console.error(`Error creating dockerignore file: ${error.message}`);
      throw new HttpException(
        `Error creating dockerignore file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
