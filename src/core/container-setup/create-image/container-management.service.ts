import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as Docker from 'dockerode';
import { DockerLogService } from './docker-log.service';
import { AlsService } from '@/utils/als/als.service';

@Injectable()
export class ContainerManagementService {
  private docker: Docker;

  constructor(
    private readonly dockerLogService: DockerLogService,
    private readonly alsService: AlsService,
  ) {
    this.docker = new Docker();
  }

  async startContainer(imageName: string,deploymentId:number): Promise<number> {
    try {
      // Create the container using the specified image
      const container = await this.docker.createContainer({
        Image: imageName,
        name: `${imageName}-container`,
        Tty: true,
        ExposedPorts: { '4200/tcp': {} },
        HostConfig: { PortBindings: { '4200/tcp': [{}] } },
      });
      await container.start();

      let containerInfo;
      const maxRetries = 5;
      const delayMs = 1000;
      for (let i = 0; i < maxRetries; i++) {
        containerInfo = await container.inspect();
        const portBindings = containerInfo?.NetworkSettings?.Ports?.['4200/tcp'];
        if (portBindings && portBindings[0] && portBindings[0].HostPort) {
          break;
        }
        console.log(`Waiting for port mapping to be assigned... (${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const portBindings = containerInfo.NetworkSettings.Ports['4200/tcp'];
      if (!portBindings || !portBindings[0] || !portBindings[0].HostPort) {
        throw new Error("Failed to obtain HostPort mapping from container");
      }
      const assignedPort = portBindings[0].HostPort;
      console.log(`Container started on port: ${assignedPort}`);

      // Send a log message to the user
      const repositoryId = this.alsService.getrepositoryId();
      if (repositoryId) {
        this.dockerLogService.logMessage(`Container started on port: ${assignedPort}`,deploymentId);
      }

      return parseInt(assignedPort);
    } catch (error) {
      console.error('Docker error in startContainer:', error);
      if (error.statusCode) {
        throw new HttpException(
          `Docker error: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        `Failed to start container: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
