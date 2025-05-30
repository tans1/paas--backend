import { ImageBuildService } from '@/core/container-setup/create-image/image-build.service';
import { DeploymentUtilsService } from '@/core/container-setup/deployment-utils/deployment-utils.service';
import { ManageContainerService } from '@/core/container-setup/manage-containers/manage-containers.service';
import { DeploymentRepositoryInterface } from '@/infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import {
  ProjectsRepositoryInterface,
  StatusEnum,
  UpdateProjectDTO,
} from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Deployment, Project } from '@prisma/client';
import { rm } from 'fs/promises';
import { ProjectsController } from '../projects.controller';

@Injectable()
export class ManageProjectService {
  constructor(
    private manageContainerService: ManageContainerService,
    private projectRepositoryService: ProjectsRepositoryInterface,
    private deploymentUtilsService: DeploymentUtilsService,
    private imageBuildService: ImageBuildService,
    private deploymentRepositoryService: DeploymentRepositoryInterface,
  ) {}

  /**
   * Starts the project containers and updates status
   */
  async startProject(projectId: number): Promise<void> {
    const project = await this.getExistingProject(projectId);
    const activeDeployment = await this.getActiveDeployment(project);
    try {
      await this.manageContainerService.start(
        project.localRepoPath,
        project.repoId,
        activeDeployment,
      );
      await this.projectRepositoryService.update(projectId, {
        status: StatusEnum.RUNNING,
      });
      return project;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to start project ${projectId}: ${err.message}`,
      );
    }
  }

  /**
   * Stops the project containers and updates status
   */
  async stopProject(projectId: number): Promise<void> {
    const project = await this.getExistingProject(projectId);
    const activeDeployment = await this.getActiveDeployment(project);

    try {
      await this.manageContainerService.stop(
        project.localRepoPath,
        activeDeployment,
      );
      await this.projectRepositoryService.update(projectId, {
        status: StatusEnum.STOPPED,
      });
      return project;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to stop project ${projectId}: ${err.message}`,
      );
    }
  }

  /**
   * Tears down containers, removes image, and deletes project record
   */
  async deleteProject(projectId: number): Promise<void> {
    const project = await this.getExistingProject(projectId);
    const activeDeployment = await this.getActiveDeployment(project);

    const containerName = activeDeployment.containerName;
    const imageName = activeDeployment.imageName;

    try {
      // await this.manageContainerService.down(
      //   project.localRepoPath,
      //   activeDeployment,
      //   true,
      // );

      if (containerName) {
        this.manageContainerService.rm(containerName, project.localRepoPath);
      }

      // const latestImageName = this.deploymentUtilsService.getLatestImageName(
      //   project.deployments,
      // );
      if (imageName) {
        await this.imageBuildService.removeImage(
          imageName,
          project.localRepoPath,
        );
      }

      await this.projectRepositoryService.delete(projectId);
      await rm(project.localRepoPath, { recursive: true, force: true });

      return project;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to delete project ${projectId}: ${err.message}`,
      );
    }
  }

  async rollback(projectId: number, deploymentId: number): Promise<void> {
    const project = await this.getExistingProject(projectId);
    const activeDeployment = await this.getActiveDeployment(project);
    const rollbackDeployment =
      await this.deploymentRepositoryService.findById(deploymentId);

    try {
      await this.manageContainerService.rollback(
        project.localRepoPath,
        project.name,
        project.repoId,
        project.dockerComposeFile,
        rollbackDeployment,
      );

      await this.projectRepositoryService.update(project.id, {
        activeDeploymentId: deploymentId,
      });
      await this.manageContainerService.rm(
        activeDeployment.containerName,
        project.localRepoPath,
      );
      await this.imageBuildService.removeImage(
        activeDeployment.imageName,
        project.localRepoPath,
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to rollback project ${projectId} to deployment ${deploymentId}: ${err.message}`,
      );
    }
  }

  /**
   * Updates the project details
   */
  async updateProject(
    projectId: number,
    updateData: Partial<UpdateProjectDTO>,
  ): Promise<Project> {
    
    try {
      await this.projectRepositoryService.update(projectId, updateData);
      const project = await this.getExistingProject(projectId);
      return project;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to update project ${projectId}: ${err.message}`,
      );
    }
  }

  /**
   * Helper: fetches project or throws NotFoundException
   */
  private async getExistingProject(projectId: number): Promise<any> {
    try {
      const project = await this.projectRepositoryService.findById(projectId);
      if (!project) {
        throw new NotFoundException(`Project ${projectId} not found`);
      }
      return project;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Error retrieving project ${projectId}: ${err.message}`,
      );
    }
  }

  private async getActiveDeployment(project: Project): Promise<Deployment> {
    const activeDeploymentId = project.activeDeploymentId;
    const activeDeployment =
      this.deploymentRepositoryService.findById(activeDeploymentId);
    return activeDeployment;
  }
}

