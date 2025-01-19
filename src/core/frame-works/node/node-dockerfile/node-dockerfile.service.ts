import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { EventNames } from 'src/core/events/event.module';
import { FrameworkMap } from '../frameworks.constants';
import { v4 as uuidv4 } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class NodeDockerfileService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createDockerfile(projectConfig: {
    projectPath: string;
    nodeVersion?: string;
    framework?: string;
    startCommand: string;
    buildCommand?: string;
  }): Promise<void> {
    const { projectPath, nodeVersion = '16', framework, startCommand, buildCommand } = projectConfig;

    try {
      const templatePath = path.join(__dirname, 'templates', FrameworkMap[framework].dockerFile);
      
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

      let dockerfileContent = '';
      if (FrameworkMap[framework].type === 'frontend') {
        dockerfileContent = ejs.render(templateContent, {
          nodeVersion,
          buildCommand: buildCommand || 'npm run build -- --output-path dist',
        });
      }

      if (FrameworkMap[framework].type === 'backend') {
        dockerfileContent = ejs.render(templateContent, {
          nodeVersion,
          startCommand,
        });
      }

      const dockerfilePath = path.join(projectPath, 'Dockerfile');
      await fs.promises.writeFile(dockerfilePath, dockerfileContent, 'utf-8');

      this.eventEmitter.emit(EventNames.DOCKERFILE_GENERATED, {
        projectPath,
        dockerfilePath,
        imageName: `${framework}-${uuidv4()}`,
      });

    } catch (error) {
      console.error(`Error creating Dockerfile: ${error.message}`);
      throw new HttpException(
        `Error creating Dockerfile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
