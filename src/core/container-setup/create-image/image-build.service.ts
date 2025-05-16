import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec, spawn } from 'child_process';
import { DockerLogService } from './docker-log.service';
import { FileService } from './file.service';
import { promisify } from 'util';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { branch } from 'isomorphic-git';
import { LogType } from '../enums/log-type.enum';

const execAsync = promisify(exec);
@Injectable()
export class ImageBuildService {
  constructor(
    private readonly dockerLogService: DockerLogService,
    private readonly fileService: FileService,
  ) {}

  async buildImage(
    projectPath: string,
    repositoryId : number,
     deploymentId: number,
     branch : string
    ): Promise<void> {
    const composeFileName = `docker-compose.${process.env.DEPLOYMENT_HASH}.yml`;
    const child = spawn(
      'docker',
      ['compose', '-f', composeFileName, 'up','--detach', '--build'],
      {
        cwd: projectPath,
      },
    );

    // this.dockerLogService.handleDockerStream(child.stdout, deploymentId).catch(console.error);
    // this.dockerLogService.handleDockerStream(child.stderr, deploymentId).catch(console.error);
    // I want to continuesly get stdout streams even after the build is complete and the application has
    // started but at the moment we are just printing the logs for the build process
    await Promise.all([
      this.dockerLogService.handleDockerStream(
        child.stdout, 
        repositoryId,
        branch,
        LogType.BUILD,
        deploymentId,
      ), 
      this.dockerLogService.handleDockerStream(
        child.stderr,
        repositoryId,
        branch,
        LogType.BUILD,
        deploymentId,
      ),
    ]);

    // return 
  }

  async createDockerComposeFile(
    projectPath: string,
    projectName: string,
    deploymentUrl: string,
    PORT: number = 80,
    dockerFile?: string,
  ): Promise<[string, string, string]> {
    const extension = uuidv4();
    const templatePath = path.join(
      __dirname,
      'templates',
      'docker-compose.yml.ejs',
    );
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

    const envFileName = `${projectName}.${process.env.DEPLOYMENT_HASH}.env`;
    const envFilePath = path.join(projectPath, envFileName);

    const includeEnvFile = fs.existsSync(envFilePath);
    if (!dockerFile) {
      dockerFile = `Dockerfile.${process.env.DEPLOYMENT_HASH}`;
    }
    const extendedProjectName = `${projectName}-${extension}`;
    const imageName = `${process.env.DOCKER_USERNAME}/${projectName}:${extension}`;
    const containerName = `${projectName}-${extension}`;
    const dockerComposeFile = `docker-compose.${process.env.DEPLOYMENT_HASH}.yml`
    const dockerComposeContent = ejs.render(templateContent, {
      projectName: extendedProjectName,
      extension: extension,
      deploymentUrl: deploymentUrl,
      envFileName: envFileName,
      includeEnvFile: includeEnvFile,
      dockerFile: dockerFile,
      imageName: imageName,
      containerName: containerName,
      PORT: PORT,
    });

    const dockerComposePath = path.join(
      projectPath,
      dockerComposeFile,
    );
    await fs.promises.writeFile(
      dockerComposePath,
      dockerComposeContent,
      'utf-8',
    );
    return [imageName, containerName,dockerComposeFile];
  }

  // async removeContainer(
  //   containerName: string,
  //   projectPath: string,
  // ): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     const remove = spawn('docker', ['rm', '-f', containerName], {
  //       //docker rm -f
  //       cwd: projectPath,
  //       stdio: 'inherit',
  //       env: process.env,
  //     });

  //     remove.on('error', (err) => {
  //       reject(new Error(`Failed to remove container: ${err.message}`));
  //     });

  //     remove.on('exit', (rmCode) => {
  //       if (rmCode === 0) {
  //         resolve();
  //       } else {
  //         reject(new Error(`docker compose rm failed with code ${rmCode}`));
  //       }
  //     });
  //   });
  // }
  async removeImage(imageName: string, projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const removeImageProcess = spawn('docker', ['rmi', '-f', imageName], {
        cwd: projectPath,
        stdio: 'inherit',
        env: process.env,
      });

      removeImageProcess.on('error', (err) => {
        reject(new Error(`Failed to remove image: ${err.message}`));
      });

      removeImageProcess.on('exit', (exitCode) => {
        if (exitCode === 0) {
          resolve();
        } else {
          reject(new Error(`docker rmi failed with code ${exitCode}`));
        }
      });
    });
  }
}
