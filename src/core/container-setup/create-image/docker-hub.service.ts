import { Injectable, Logger } from '@nestjs/common';
import * as Docker from 'dockerode';
import { DockerLogService } from './docker-log.service';
import { AlsService } from '@/utils/als/als.service';
import { LogType } from '../enums/log-type.enum';

@Injectable()
export class DockerHubService {
  private docker: Docker;
  private readonly logger = new Logger(DockerHubService.name);

  constructor(
    private readonly dockerLogService: DockerLogService,
    private alsService: AlsService,
  ) {
    this.docker = new Docker();
  }

  async pushImage(
    localImageName: string,
    repositoryId: number,
    branch: string,
    deploymentId: number
  ): Promise<void> {
    try {
      const authConfig = {
        username: process.env.DOCKER_USERNAME,
        password: process.env.DOCKER_PASSWORD,
      };

      const pushStream = await this.docker
        .getImage(localImageName)
        .push({ authconfig: authConfig });

      await this.dockerLogService.handleDockerStream(
        pushStream,
        repositoryId,
        branch,
        LogType.BUILD,
        deploymentId
      );

      this.logger.log(`Image pushed to Docker Hub: ${localImageName}`);
    } catch (error) {
      this.logger.error(`Push failed for ${localImageName}: ${error.message}`);
      throw new Error(`[DOCKER_PUSH_FAILED] ${error.message}`);
    }
  }

  async pullImage(
    imageName: string,
    repositoryId: number,
    branch: string,
    deploymentId: number
  ): Promise<void> {
    try {
      const authConfig = {
        username: process.env.DOCKER_USERNAME,
        password: process.env.DOCKER_PASSWORD,
      };

      const pullStream = await this.docker.pull(imageName, {
        authconfig: authConfig
      });

      await this.dockerLogService.handleDockerStream(
        pullStream,
        repositoryId,
        branch,
        LogType.BUILD,
        deploymentId
      );

      this.logger.log(`Image pulled from Docker Hub: ${imageName}`);
    } catch (error) {
      this.logger.error(`Pull failed for ${imageName}: ${error.message}`);
      throw new Error(`[DOCKER_PULL_FAILED] ${error.message}`);
    }
  }
}