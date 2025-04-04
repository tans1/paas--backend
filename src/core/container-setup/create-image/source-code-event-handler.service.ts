import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { ImageBuildService } from './image-build.service';
// import { ContainerManagementService } from './container-management.service';
import { DockerPushService } from './docker-push.service';
import {
  CreateDeploymentDTO,
  DeploymentRepositoryInterface,
} from '@/infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { AlsService } from '@/utils/als/als.service';
import { DockerLogService } from './docker-log.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';

@Injectable()
export class SourceCodeEventHandlerService {
  constructor(
    private imageBuildService: ImageBuildService,
    // private containerManagementService: ContainerManagementService,
    private dockerPushService: DockerPushService,
    private deploymentRepositoryService: DeploymentRepositoryInterface,
    private alsService: AlsService,
    private dockerLogService: DockerLogService,
    private projectRepositoryService: ProjectsRepositoryInterface,
  ) {}

  private getSanitizedProjectName(projectName: string): string {
    const sanitizedProjectName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^[^a-z]+/, 'a');

    return sanitizedProjectName;
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

      await this.projectRepositoryService.update(projectId, {
        localRepoPath: payload.projectPath,
      });
      const createDeploymentDTO: CreateDeploymentDTO = {
        projectId: projectId,
        status: 'in-progress',
        branch: payload.branch || 'main',
        environmentVariables: payload.environmentVariables,
      };

      deployment =
        await this.deploymentRepositoryService.create(createDeploymentDTO);
      this.dockerLogService.logMessage(
        `Deployment started for project: ${projectId}`,
        deployment.id,
      );

      const projectName = this.getSanitizedProjectName(
        this.alsService.getrepositoryName(),
      );
      const deployedUrl = `${projectName}.${process.env.DOMAIN_NAME}`;
      const extendedProjectName = await this.imageBuildService.buildImage(
        payload.projectPath,
        deployment.id,
        projectName,
        deployedUrl,
      );

      await this.projectRepositoryService.update(projectId, {
        deployedUrl: deployedUrl,
      });

      await this.deploymentRepositoryService.update(deployment.id, {
        status: 'deployed',
      });

      this.dockerLogService.logMessage(
        `Project ${projectId} is now running on ${deployedUrl}`,
        deployment.id,
      );

      await this.dockerPushService.pushImage(extendedProjectName);
    } catch (error) {
      console.error('Error during deployment process:', error);

      if (deployment) {
        await this.deploymentRepositoryService.update(deployment.id, {
          status: 'failed',
        });
        this.dockerLogService.logMessage(
          `Deployment failed: ${error.message}`,
          deployment.id,
        );
      }

      throw new HttpException(
        `Deployment failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
