import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { ImageBuildService } from './image-build.service';
import { DockerPushService } from './docker-push.service';
import {
  CreateDeploymentDTO,
  DeploymentRepositoryInterface,
} from '@/infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { AlsService } from '@/utils/als/als.service';
import { DockerLogService } from './docker-log.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import * as os from 'os';
import { PORT } from '@/core/frame-works/angular/constants';
import { branch } from 'isomorphic-git';

@Injectable()
export class SourceCodeEventHandlerService {
  constructor(
    private imageBuildService: ImageBuildService,
    private dockerPushService: DockerPushService,
    private deploymentRepositoryService: DeploymentRepositoryInterface,
    private alsService: AlsService,
    private dockerLogService: DockerLogService,
    private projectRepositoryService: ProjectsRepositoryInterface
  ) {}

  @OnEvent(EventNames.SourceCodeReady)
  async handleSourceCodeReady(payload: {
    projectPath: string;
    projectId: number;
    environmentVariables?: any;
    dockerHubRepo: string;
    PORT?: number;
  }): Promise<void> {
    console.log('SourceCodeReady event received:', payload);

    
    let deployment;
    try {
      const repoId = this.alsService.getrepositoryId();
      const branch = this.alsService.getbranchName(); 
      const project = await this.projectRepositoryService.findByRepoAndBranch(repoId,branch);
      const deployments = project.deployments || [];
      const latestContainerName = this.getLatestContainerName(deployments);  
      const latestImageName = this.getLatestImageName(deployments);
      const projectId = project.id;

      const createDeploymentDTO: CreateDeploymentDTO = {
        projectId: projectId,
        status: 'in-progress',
        branch: branch,
        environmentVariables: payload.environmentVariables,
      };

      deployment = await this.deploymentRepositoryService.create(createDeploymentDTO);
      this.dockerLogService.logMessage(`Deployment started for project: ${projectId}`, deployment.id);

      const projectName = this.alsService.getprojectName()
      const deployedUrl = this.getDeployedUrl(projectName)
      const [imageName,containerName] = await this.imageBuildService.createDockerComposeFile(
        payload.projectPath,
        projectName,
        deployedUrl,
        PORT,
      )
      await this.imageBuildService.buildImage(
        payload.projectPath,
        deployment.id
      );

  
      await this.projectRepositoryService.update(projectId, {
        deployedUrl: deployedUrl,
      });

      await this.deploymentRepositoryService.update(deployment.id, {
        status: 'deployed',
        imageName: imageName,
        containerName: containerName,
      });

      this.dockerLogService.logMessage(
        `Project ${projectId} is now running on ${deployedUrl}`,
        deployment.id
      );
      
      await this.dockerPushService.pushImage(imageName);
      if (latestContainerName) {
        await this.imageBuildService.removeContainer(latestContainerName, payload.projectPath);
      }
      if (latestImageName) {
        await this.imageBuildService.removeImage(latestImageName, payload.projectPath);
      }
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

  getDeployedUrl(projectName: string): string {
    const deployedUrl = `${projectName}.${process.env.DOMAIN_NAME}`;
    return deployedUrl;
  }

  getLatestContainerName(deployments: { createdAt: Date; containerName?: string | null }[]): string | null {
    if (!deployments || deployments.length === 0) {
      return null;
    }
  
    const latest = deployments.reduce((latestDeployment, current) => {
      return new Date(current.createdAt) > new Date(latestDeployment.createdAt) ? current : latestDeployment;
    });
  
    return latest.containerName ?? null;
  }

  getLatestImageName(deployments: { createdAt: Date; imageName?: string | null }[]): string | null {
    if (!deployments || deployments.length === 0) {
      return null;
    }
  
    const latest = deployments.reduce((latestDeployment, current) => {
      return new Date(current.createdAt) > new Date(latestDeployment.createdAt) ? current : latestDeployment;
    });
  
    return latest.imageName ?? null;
  }
  

}
