import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';

// TODO: Add docker ignore file as well
// TODO: Consider updating the nginx server to node server to handle SSR and CSR
@Injectable()
export class AngularDockerfileService {
  constructor() {}

  async createDockerfile(projectConfig: {
    projectPath: string;
    nodeVersion?: string;
    defaultBuildLocation?: string;
  }): Promise<void> {

    const {
      projectPath,
      nodeVersion = '16',
      defaultBuildLocation
    } = projectConfig;

    try {
      const templatePath = path.join(
        __dirname,
        'templates',
        'Dockerfile.ejs',
      );

      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

      let dockerfileContent = '';
     
      dockerfileContent = ejs.render(templateContent, {
        nodeVersion,
        outputDir: defaultBuildLocation,
      });

      const dockerfilePath = path.join(projectPath, 'Dockerfile');
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
