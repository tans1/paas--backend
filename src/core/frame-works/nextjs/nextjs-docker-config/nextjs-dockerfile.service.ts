import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PORT } from '../constants';

@Injectable()
export class NextJsDockerfileService {
  private readonly logger = new Logger(NextJsDockerfileService.name);

  constructor() {}

  async createDockerfile(projectConfig: {
    projectPath: string;
    nodeVersion?: string;
    output: 'standalone' | 'export' | null;
    installCommand : string,
    buildCommand : string,
    outputDirectory: string,
    runCommand: string
  }): Promise<void> {
    const {
       projectPath, 
       nodeVersion = '20', 
       output,
       installCommand,
       buildCommand,
       outputDirectory,
       runCommand

      } = projectConfig;

    try {
      const staticFolder = outputDirectory === '.next' ? 'out' : outputDirectory;
      const templateName = this.determineTemplate(output);
      const templatePath = path.join(
        __dirname,
        'templates',
        templateName,
      );

      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

      const dockerfileContent = ejs.render(templateContent, {
        nodeVersion,
        port: PORT,
        output,
        projectPath,
        installCommand,
        buildCommand,
        outputDirectory,
        runCommand,
        staticFolder
      });

      const dockerFilePath = path.join(
        projectPath,
        `Dockerfile.${process.env.DEPLOYMENT_HASH}`,
      );
      await fs.promises.writeFile(dockerFilePath, dockerfileContent, 'utf-8');
    } catch (error) {
      this.logger.error(`Dockerfile creation failed: ${error.message}`);
      throw new HttpException(
        `Error creating Dockerfile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private determineTemplate(output: any): string {
    if (output === 'export') {
      return 'static.Dockerfile.ejs';
    }
    if (output === 'standalone') {
      return 'standalone.Dockerfile.ejs';
    }
    return 'default.Dockerfile.ejs';
  }

}
