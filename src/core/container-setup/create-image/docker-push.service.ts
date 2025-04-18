import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as Docker from 'dockerode';
import { DockerLogService } from './docker-log.service';
import path from 'path';
import { AlsService } from '@/utils/als/als.service';

@Injectable()
export class DockerPushService {
  private docker: Docker;

  constructor(private readonly dockerLogService: DockerLogService,
    private alsService: AlsService
  ) {
    this.docker = new Docker();
  }

  async pushImage(localImageName: string): Promise<void> {
    try {

      const authconfig = {
        username: process.env.DOCKER_USERNAME,
        password: process.env.DOCKER_PASSWORD,
      };

      const pushStream = await this.docker.getImage(localImageName).push({ authconfig });
      await this.dockerLogService.handleDockerStream(pushStream);
      console.log(`Image pushed to Docker Hub: ${localImageName}`);
    } catch (error) {
      console.error('Error pushing image to Docker Hub:', error);
      throw new HttpException(
        `Error pushing image: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
