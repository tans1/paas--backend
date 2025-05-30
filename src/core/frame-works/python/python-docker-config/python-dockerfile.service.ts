import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import { modifyRunCommand } from './run-command.utils';
import { PORT } from '../constants';

@Injectable()
export class PythonDockerfileService {
  constructor() {}

  async createDockerfile(projectConfig: {
    projectPath: string;
    pythonVersion: string;
    runCommand: string;
    depsType: string,
    installFlags: string,
    hasLockFile: boolean
  }): Promise<void> {
    const {
      projectPath,
      pythonVersion,
      runCommand,
      depsType,
      installFlags,
      hasLockFile
    } = projectConfig;

    try {
      const templatePath = path.join(__dirname, 'templates', 'Dockerfile.ejs');
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

      const modifiedRunCommand = modifyRunCommand(runCommand);
      const dockerfileContent = ejs.render(templateContent, {
        pythonVersion,
        PORT,
        runCommand: modifiedRunCommand,
        depsType,
        installFlags,
        hasLockFile
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
