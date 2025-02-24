import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { ImageBuildService } from './image-build.service';
import { ContainerManagementService } from './container-management.service';
import { DockerPushService } from './docker-push.service';
// import { DeploymentService } from './deployment.service';

@Injectable()
export class SourceCodeEventHandlerService {
  constructor(
    private readonly imageBuildService: ImageBuildService,
    private readonly containerManagementService: ContainerManagementService,
    private readonly dockerPushService: DockerPushService,
    // private readonly deploymentService: DeploymentService,
  ) {}

  @OnEvent(EventNames.SourceCodeReady)
  async handleSourceCodeReady(payload: { 
      projectPath: string; 
      projectId: number;
      branch?: string;
      environmentVariables?: any;
      dockerHubRepo: string; // e.g., "username/myapp"
  }): Promise<void> {
    console.log('SourceCodeReady event received:', payload);
    try {
      // Build the Docker image
      const builtImageName = await this.imageBuildService.buildImage(payload.projectPath);

      // Optionally start the container and retrieve its assigned port
      const assignedPort = await this.containerManagementService.startContainer(builtImageName);

      // Push the image to Docker Hub
      await this.dockerPushService.pushImage(builtImageName);

      // Create a deployment record in the database
    //   const deployment = await this.deploymentService.createDeployment({
    //     repoId: payload.projectId,
    //     status: 'deployed',
    //     branch: payload.branch || 'main',
    //     environmentVariables: payload.environmentVariables,
    //   });
    //   console.log('Deployment record created:', deployment);

      // Optionally update your Project record with the deployed IP/port
      // (for example, using your Prisma service)
    } catch (error) {
      console.error('Error processing SourceCodeReady event:', error);
      // Optionally, you can store failure details in the deployment record here.
    }
  }
}
