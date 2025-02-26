import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { EventNames } from 'src/core/events/event.module';
import { FrameworkMap } from '../frameworks.constants';
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
    defaultBuildLocation?: string;
  }): Promise<void> {
    const { projectPath, nodeVersion = '16', framework, startCommand, buildCommand } = projectConfig;

    try {
      const templatePath = path.join(__dirname, 'templates', FrameworkMap[framework].dockerFile);
      
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

      let dockerfileContent = '';
      if (FrameworkMap[framework].type === 'frontend') {

        if (framework === 'angular') {
          const angularConfigPath = path.join(projectPath, 'angular.json');
          const angularConfigContent = await fs.promises.readFile(angularConfigPath, 'utf-8');
          const angularConfig = JSON.parse(angularConfigContent);
      
          // Get the project name dynamically if defaultProject is undefined
          const projectName = angularConfig.defaultProject || Object.keys(angularConfig.projects)[0];
      
          if (!projectName) {
              throw new Error("No projects found in angular.json");
          }
      
          const outputPath = angularConfig.projects[projectName].architect.build.options.outputPath;
          projectConfig.defaultBuildLocation = `${outputPath}/browser`;
      }
        dockerfileContent = ejs.render(templateContent, {
          nodeVersion,
          buildCommand: buildCommand,
          outputDir: projectConfig.defaultBuildLocation,
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

      this.eventEmitter.emit(EventNames.SourceCodeReady, {
        projectPath
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
