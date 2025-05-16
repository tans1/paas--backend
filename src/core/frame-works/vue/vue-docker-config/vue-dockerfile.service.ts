import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PORT } from '../constants';

@Injectable()
export class VueDockerfileService {
  constructor() {}

  async createDockerfile(projectConfig: {
    projectPath: string;
    nodeVersion?: string;
    installCommand: string;
    buildCommand: string;
    outputDirectory: string;
  }): Promise<void> {
    const {
      projectPath,
      nodeVersion = '16',
      installCommand,
      buildCommand,
      outputDirectory,
    } = projectConfig;

    try {
      const templatePath = path.join(__dirname, 'templates', 'Dockerfile.ejs');

      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

      let dockerfileContent = '';

      dockerfileContent = ejs.render(templateContent, {
        nodeVersion,
        PORT: PORT,
        installCommand,
        buildCommand,
        outputDirectory,
      });

      const dockerFile = `Dockerfile.${process.env.DEPLOYMENT_HASH}`;
      const dockerfilePath = path.join(projectPath, dockerFile);
      await fs.promises.writeFile(dockerfilePath, dockerfileContent, 'utf-8');
    } catch (error) {
      console.error(`Error creating Dockerfile: ${error.message}`);
      throw new HttpException(
        `Error creating Dockerfile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
