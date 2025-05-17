import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { DockerLogService } from './docker-log.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { DeploymentUtilsService } from '../deployment-utils/deployment-utils.service';
import { LogType } from '../enums/log-type.enum';


@Injectable()
export class RuntimeLogService /* implements OnApplicationBootstrap */ {
  private readonly logger = new Logger(RuntimeLogService.name);

  constructor(
    private projectRepositoryService: ProjectsRepositoryInterface,
    private readonly dockerLogService: DockerLogService,
    private deploymentUtilsService : DeploymentUtilsService
  ) {}

  /**
   * Lifecycle hook: called once the application has bootstrapped.
   * Iterates over all projects and attaches to their container logs.
   */
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Bootstrapping container log streaming for all projects...');

    // Retrieve all registered projects
    const projects = await this.projectRepositoryService.getAllProjects()
    for (const project of projects) {
      try {
        let latestDeployment = this.deploymentUtilsService.getLatestDeployment(project.deployments)
        if (!latestDeployment){
          continue 
        }
        const containerName = latestDeployment.containerName
        const deploymentId = latestDeployment.id; // lasts deployment Id 
        const branch  = project.branch
        this.logger.log(`Attaching to logs for container '${containerName}' (project ${deploymentId})`);
        this.streamContainerLogs(
            containerName,
            project.repoId,
            branch,
            deploymentId);
      } catch (err) {
        this.logger.error('Error streaming logs for project', err);
      }
    }
  }

  /**
   * Spawns `docker logs -f` for the given container and streams output
   * through the DockerLogService.
   */
  public streamContainerLogs(
    containerName: string,
    repositoryId : number,
    branch: string,
    deploymentId: number,
  ): void {
    const args = ['logs', '--follow', '--tail', '0', containerName];
    this.logger.debug(`Running command: docker ${args.join(' ')}`);

    const proc: ChildProcessWithoutNullStreams = spawn('docker', args);

    // Stream stdout
    this.dockerLogService.handleDockerStream(
        proc.stdout, 
        repositoryId,
        branch,
        LogType.RUNTIME,
        deploymentId,
    )
      .catch(err => this.logger.error('Error streaming stdout', err));

    // Stream stderr
    this.dockerLogService.handleDockerStream(
        proc.stderr, 
        repositoryId,
        branch,
        LogType.RUNTIME,
        deploymentId,)
      .catch(err => this.logger.error('Error streaming stderr', err));

    // Cleanup on exit
    proc.on('exit', code => {
      this.logger.log(`Log stream for '${containerName}' exited with code ${code}`);
    });

    proc.on('error', err => {
      this.logger.error(`Failed to spawn docker logs for '${containerName}'`, err);
    });
  }
}
