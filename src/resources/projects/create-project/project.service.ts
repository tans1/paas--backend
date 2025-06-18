import {
  ProjectsRepositoryInterface,
  CreateProjectDTO,
  UpdateProjectDTO,
} from '../../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { UsersRepositoryInterface } from '../../../infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ProjectService {
  constructor(
    private projectRepositoryService: ProjectsRepositoryInterface,
    private userService: UsersRepositoryInterface,
  ) {}

  public async createProject({
    userName,
    repository,
    branch,
    environmentVariables,
    framework,
    installCommand,
    buildCommand,
    runCommand,
    outputDirectory,
    rootDirectory,
    projectDescription,
    lastCommitMessage
  }: {
    userName: string;
    repository: any;
    branch: string;
    environmentVariables: any;
    framework: string;
    installCommand: string;
    buildCommand: string;
    runCommand: string;
    outputDirectory: string;
    rootDirectory: string;
    projectDescription: string,
    lastCommitMessage: string
  }) {
    try {
      // const userName = repository.owner.login;
      const user = await this.userService.findOneByUserName(userName);

      const createProjectDto: CreateProjectDTO = {
        name: repository?.name,
        url: repository?.html_url || repository?.url,
        linkedByUserId: user?.id,
        repoId: repository?.id,
        environmentVariables: environmentVariables,
        branch: branch,
        framework: framework,
        installCommand: installCommand,
        buildCommand: buildCommand,
        runCommand: runCommand,
        outputDirectory: outputDirectory,
        rootDirectory: rootDirectory,
        projectDescription,
        lastCommitMessage
      };

      return await this.projectRepositoryService.create(createProjectDto);
      // the only thing I need is the repoId
    } catch (error) {
      console.error('Error creating project:', error);

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async findByRepoAndBranch(repoId: number, branch: string) {
    try {
      return await this.projectRepositoryService.findByRepoAndBranch(
        repoId,
        branch,
      );
    } catch (error) {
      console.error('Error finding project by repo and branch:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async updateProject(id: number, payload: UpdateProjectDTO) {
    try {
      return await this.projectRepositoryService.update(
        id,
        payload,
      );
    } catch (error) {
      console.error('Error updating project:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
