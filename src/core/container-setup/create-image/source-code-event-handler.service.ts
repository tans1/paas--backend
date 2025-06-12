import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from '../../events/event.module';
import { ImageBuildService } from './image-build.service';
import {
  CreateDeploymentDTO,
  DeploymentRepositoryInterface,
} from '../../../infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { AlsService } from '../../../utils/als/als.service';
import { DockerLogService } from './docker-log.service';
import { ProjectsRepositoryInterface,StatusEnum } from '../../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import * as os from 'os';
import { PORT } from '../../frame-works/angular/constants';
import { branch } from 'isomorphic-git';
import { RuntimeLogService } from './containter-runtime-log.service';
import { DeploymentUtilsService } from '../deployment-utils/deployment-utils.service';
import { LogType } from '../enums/log-type.enum';
import { ManageContainerService } from '../manage-containers/manage-containers.service';
import { last } from 'rxjs';
import { ImageBuildGateway } from '../gateway/Image-build-gateway';
import { DeploymentEventsGateway } from '../gateway/deployment-events.gateway';
import { DockerComposeFileService } from '../docker-compose/dockerComposeFile.service'
import { DockerComposeService } from '../docker-compose/dockerCompose.service';
import { DockerHubService } from './docker-hub.service';
@Injectable()
export class SourceCodeEventHandlerService {
  constructor(
    private imageBuildService: ImageBuildService,
    private deploymentRepositoryService: DeploymentRepositoryInterface,
    private alsService: AlsService,
    private dockerLogService: DockerLogService,
    private projectRepositoryService: ProjectsRepositoryInterface,
    private runtimeLogService : RuntimeLogService,
    private deploymentUtilsService : DeploymentUtilsService,
    private manageContainerService : ManageContainerService,
    private deploymentEventsGateway : DeploymentEventsGateway, 
    private dockerComposeFileService : DockerComposeFileService,
    private dockerComposeService : DockerComposeService,
    private dockerHubService: DockerHubService
  ) {}

  @OnEvent(EventNames.SourceCodeReady)
  async handleSourceCodeReady(payload: {
    projectPath: string;
    environmentVariables?: any;
    PORT?: number;
    dockerFile?: string;
  }): Promise<void> {
    console.log('SourceCodeReady event received:', payload);

    let deployment;
    const repoId = this.alsService.getrepositoryId();
    const branch = this.alsService.getbranchName();
    const projectName = this.alsService.getprojectName();
    const extension = this.alsService.getExtension()
    let lastCommitMessage = this.alsService.getLastCommitMessage();
    try {
      const project = await this.projectRepositoryService.findByRepoAndBranch(
        repoId,
        branch,
      );
      const deployments = project.deployments || [];
      const latestContainerName = this.deploymentUtilsService.getLatestContainerName(deployments);
      const latestImageName = this.deploymentUtilsService.getLatestImageName(deployments);
      const projectId = project.id;
      lastCommitMessage = lastCommitMessage ? lastCommitMessage : project.lastCommitMessage 

      await this.projectRepositoryService.update(projectId, {
        localRepoPath: payload.projectPath,
      });
      const createDeploymentDTO: CreateDeploymentDTO = {
        projectId: projectId,
        status: 'in-progress',
        branch: branch,
        environmentVariables: payload.environmentVariables,
        lastCommitMessage: lastCommitMessage,
        extension: extension
      };

      deployment =
        await this.deploymentRepositoryService.create(createDeploymentDTO);
        this.dockerLogService.logMessage(
        `Deployment started for project: ${projectId}`,
        repoId,
        branch,
        LogType.BUILD,
        deployment.id,
      );

      this.deploymentEventsGateway.sendNewDeploymentEvent(
        repoId,
        branch,
        {
          deploymentId : deployment.id,
          branch : branch,
          timestamp : Date.now().toString()
        }
      )

      const deployedUrl = this.deploymentUtilsService.getDeployedUrl(projectName);
      const [imageName, containerName,dockerComposeFile] =
        await this.dockerComposeFileService.createDockerComposeFile(
          payload.projectPath,
          projectName,
          deployedUrl,
          extension,
          PORT,
          payload.dockerFile,
        );

      await this.imageBuildService.buildImage(
        payload.projectPath,
        repoId,
        deployment.id,
        branch,
        imageName,
        payload.dockerFile,
      );

      await this.dockerComposeService.up(
        payload.projectPath,
        dockerComposeFile,
        extension,
        projectName,
      )
      
      this.runtimeLogService.streamContainerLogs(
        containerName,
        repoId,
        branch,
        deployment.id
      );
    
      await this.projectRepositoryService.update(projectId, {
        deployedUrl: deployedUrl,
        dockerComposeFile : dockerComposeFile,
        name : projectName,
        PORT : PORT
      });

      await this.deploymentRepositoryService.update(deployment.id, {
        status: 'deployed',
        imageName: imageName,
        containerName: containerName,
      });

   
      this.dockerLogService.logMessage(
        `Project ${projectId} is now running on ${deployedUrl}`,
        repoId,
        branch,
        LogType.BUILD,
        deployment.id,
        true
      );

      await this.dockerHubService.pushImage(
        imageName,
        repoId,
        branch,
        deployment.id
      );
      if (latestContainerName) {
        await this.manageContainerService.rm(
          latestContainerName,
          payload.projectPath,
        );
      }
      if (latestImageName) {
        await this.imageBuildService.removeImage(
          latestImageName,
          payload.projectPath,
        );
      }

      await this.projectRepositoryService.update(projectId,{
        status : StatusEnum.RUNNING,
        activeDeploymentId : deployment.id
      })

      this.deploymentEventsGateway.sendDeploymentUpdateEvent(
        repoId,
        branch,
        {
          deploymentId : deployment.id,
          status : "deployed",
          timestamp : Date.now().toString()
        }
      )


    } catch (error) {
      console.error('Error during deployment process:', error);

      if (deployment) {
        await this.deploymentRepositoryService.update(deployment.id, {
          status: 'failed',
        });
        this.dockerLogService.logMessage(
          `Deployment failed: ${error.message}`,
          repoId,
          branch,
          LogType.BUILD,
          deployment.id,
        );

        this.deploymentEventsGateway.sendDeploymentUpdateEvent(
          repoId,
          branch,
          {
            deploymentId : deployment.id,
            status : "failed",
            timestamp : Date.now().toString()
          }
        )
      }

      throw new HttpException(
        `Deployment failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


}
