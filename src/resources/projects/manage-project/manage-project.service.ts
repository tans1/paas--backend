import { ImageBuildService } from "@/core/container-setup/create-image/image-build.service";
import { DeploymentUtilsService } from "@/core/container-setup/deployment-utils/deployment-utils.service";
import { ManageContainerService } from "@/core/container-setup/manage-containers/manage-containers.service";
import {
  ProjectsRepositoryInterface,
  StatusEnum,
} from "@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface";
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Project } from "@prisma/client";
import { rm } from 'fs/promises';

@Injectable()
export class ManageProjectService {
  constructor(
    private manageContainerService: ManageContainerService,
    private projectRepositoryService: ProjectsRepositoryInterface,
    private deploymentUtilsService: DeploymentUtilsService,
    private imageBuildService: ImageBuildService,
  ) {}

  /**
   * Starts the project containers and updates status
   */
  async startProject(projectId: number): Promise<void> {
    const project = await this.getExistingProject(projectId);

    try {
      await this.manageContainerService.up(project.localRepoPath,project.dockerComposeFile);
      await this.projectRepositoryService.update(projectId, {
        status: StatusEnum.RUNNING,
      });
      return project
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

    try {
      await this.manageContainerService.stop(project.localRepoPath,project.dockerComposeFile);
      await this.projectRepositoryService.update(projectId, {
        status: StatusEnum.STOPPED,
      });
      return project
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

    try {
      await this.manageContainerService.down(
        project.localRepoPath,
        project.dockerComposeFile,
        true,
      );

      const latestImageName = this.deploymentUtilsService.getLatestImageName(
        project.deployments,
      );
      if (latestImageName) {
        await this.imageBuildService.removeImage(
          latestImageName,
          project.localRepoPath,
        );
      }

      await this.projectRepositoryService.delete(projectId);
      await rm(project.localRepoPath, { recursive: true, force: true });

      return project
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to delete project ${projectId}: ${err.message}`,
      );
    }
  }

  /**
   * Helper: fetches project or throws NotFoundException
   */
  private async getExistingProject(
    projectId: number,
  ): Promise<any> {
    try {
      const project = await this.projectRepositoryService.findById(
        projectId,
      );
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
}
