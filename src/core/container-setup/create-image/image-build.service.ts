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

// const execAsync = promisify(exec);
@Injectable()
export class ImageBuildService {
  constructor(
    private readonly dockerLogService: DockerLogService,
    private readonly fileService: FileService,
  ) {}

  async buildImage(
    projectPath: string,
    repositoryId: number,
    deploymentId: number,
    branch: string,
    imageName: string,
    dockerFile: string = `Dockerfile.${process.env.DEPLOYMENT_HASH}`,
  ): Promise<void> {
  
    const child = spawn(
      'docker',
      ['build', '-t', imageName, '-f', dockerFile, '.'],
      {
        cwd: projectPath, // Ensure the context directory is correct
      },
    );

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

    return new Promise((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Docker build failed with exit code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(new Error(`Failed to execute docker build: ${err.message}`));
      });
    });
  }

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
