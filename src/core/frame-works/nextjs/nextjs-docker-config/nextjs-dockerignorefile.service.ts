import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';


@Injectable()
export class NextJsDockerIgnoreFileService {
  constructor() {}

  async addDockerIgnoreFile(projectConfig: {
    projectPath: string;
  }): Promise<void> {

    const {
      projectPath,
    } = projectConfig;

    try {
      const templateDockerIgnoreFilePath = path.join(
        __dirname,
        'templates',
        '.dockerignore',
      );

      const dockerIgnoreFileContent = await fs.promises.readFile(templateDockerIgnoreFilePath, 'utf-8');     
      const dockerIgnoreFilePath = path.join(projectPath, '.dockerignore');
      await fs.promises.writeFile(dockerIgnoreFilePath, dockerIgnoreFileContent, 'utf-8');

    } catch (error) {
      console.error(`Error creating dockerignore file: ${error.message}`);
      throw new HttpException( 
        `Error creating dockerignore file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

  }
}
