import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { ImageBuildService } from './image-build.service';
import { ContainerManagementService } from './container-management.service';
import { DockerPushService } from './docker-push.service';
import {
  CreateDeploymentDTO,
  DeploymentRepositoryInterface,
} from '@/infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { AlsService } from '@/utils/als/als.service';
import { DockerLogService } from './docker-log.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import * as os from 'os';

@Injectable()
export class SourceCodeEventHandlerService {
  constructor(
    private imageBuildService: ImageBuildService,
    private containerManagementService: ContainerManagementService,
    private dockerPushService: DockerPushService,
    private deploymentRepositoryService: DeploymentRepositoryInterface,
    private alsService: AlsService,
    private dockerLogService: DockerLogService,
    private projectRepositoryService: ProjectsRepositoryInterface
  ) {}

  // Dynamically retrieves the machine's local IP address
  private getLocalIpAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return 'localhost';
  }

  @OnEvent(EventNames.SourceCodeReady)
  async handleSourceCodeReady(payload: {
    projectPath: string;
    projectId: number;
    branch?: string;
    environmentVariables?: any;
    dockerHubRepo: string;
  }): Promise<void> {
    console.log('SourceCodeReady event received:', payload);

    let deployment;
    try {
      const repoId = this.alsService.getrepositoryId();
      const project = await this.projectRepositoryService.findByRepoId(repoId);
      const projectId = project.id;

      const createDeploymentDTO: CreateDeploymentDTO = {
        projectId: projectId,
        status: 'in-progress',
        branch: payload.branch || 'main',
        environmentVariables: payload.environmentVariables,
      };

      deployment = await this.deploymentRepositoryService.create(createDeploymentDTO);
      this.dockerLogService.logMessage(`Deployment started for project: ${projectId}`, deployment.id);

      const builtImageName = await this.imageBuildService.buildImage(
        payload.projectPath,
        deployment.id
      );

      const assignedPort = await this.containerManagementService.startContainer(
        builtImageName,
        deployment.id
      );

      const deployedIp = this.getLocalIpAddress();

      await this.projectRepositoryService.update(projectId, {
        deployedIp,
        deployedPort: assignedPort,
      });

      await this.deploymentRepositoryService.update(deployment.id, {
        status: 'deployed',
      });

      this.dockerLogService.logMessage(
        `Project ${projectId} is now running on ${deployedIp}:${assignedPort}`,
        deployment.id
      );

      await this.dockerPushService.pushImage(builtImageName);
    } catch (error) {
      console.error('Error during deployment process:', error);

      if (deployment) {
        await this.deploymentRepositoryService.update(deployment.id, {
          status: 'failed',
        });
        this.dockerLogService.logMessage(`Deployment failed: ${error.message}`, deployment.id);
        
      }
      
      throw new HttpException(
        `Deployment failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
