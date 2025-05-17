import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { RepositoryBootstrapService } from '../repository-bootstrap/repository-bootstrap.service';
import { RepositorySyncService } from '../repository-sync/repository-sync.service';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AlsService } from '@/utils/als/als.service';
import { UsersService } from '@/resources/users/users.service';
import { EnvironmentService } from '@/utils/environment/environment.service';

@Injectable()
export class ProjectInitializedEventListenerService {
  private readonly logger = new Logger(
    ProjectInitializedEventListenerService.name,
  );
  private readonly baseRepoPath =
    process.env.PROJECTS_BASE_PATH || path.join(process.cwd(), 'projects');

  constructor(
    private readonly repositoryBootstrapService: RepositoryBootstrapService,
    private eventEmitter: EventEmitter2,
    private alsService: AlsService,
    private userService: UsersService,
    private environmentService: EnvironmentService,
  ) {}

  @OnEvent(EventNames.PROJECT_INITIALIZED)
  async processProject(payload: any) {
    const { repository, branch, email, environmentVariables } = payload;
    const repoFullName = repository?.full_name;
    const cloneUrl = repository?.clone_url;
    // const ref = payload.ref;
    // const branch = ref.replace('refs/heads/', '');
    const user = await this.userService.findOneBy(email);
    const githubAccessToken = user.githubAccessToken;
    this.alsService.setbranchName(branch);
    if (!repoFullName || !cloneUrl) {
      this.logger.error('Invalid payload: missing repository information.');
      return;
    }

    const localRepoPath = path.join(this.baseRepoPath, repoFullName, branch);

    try {
      this.logger.log(
        `Repository ${repoFullName} not found locally. Cloning...`,
      );
      await this.repositoryBootstrapService.bootstrapRepository(
        cloneUrl,
        localRepoPath,
        branch,
        githubAccessToken,
      );
      await this.environmentService.addEnvironmentFile({
        environmentVariables,
        projectPath: localRepoPath,
      });
      this.logger.log(`Repository ${repoFullName} cloned successfully.`);
      this.eventEmitter.emit(EventNames.PROJECT_UPLOADED, {
        projectPath: localRepoPath,
      });
    } catch (error) {
      this.logger.error(
        `Error processing repository ${repoFullName}: ${error.message}`,
        error.stack,
      );
    }
    // try {
    //   if (!repoExists) {
    //     this.logger.log(`Repository ${repoFullName} not found locally. Cloning...`);
    //     await this.repositoryBootstrapService.bootstrapRepository(cloneUrl, localRepoPath,branch);
    //     this.logger.log(`Repository ${repoFullName} cloned successfully.`);
    //     this.eventEmitter.emit(EventNames.PROJECT_UPLOADED, { projectPath: localRepoPath });
    //   } else {
    //     this.logger.log(`Repository ${repoFullName} exists. Syncing updates...`);
    //     await this.repositorySyncService.syncRepository(localRepoPath,userName,userEmail,branch);
    //     this.logger.log(`Repository ${repoFullName} updated successfully.`);
    //     this.eventEmitter.emit(EventNames.SourceCodeReady, { projectPath: localRepoPath });
    //   }

    // } catch (error) {
    //   this.logger.error(
    //     `Error processing repository ${repoFullName}: ${error.message}`,
    //     error.stack,
    //   );

    // }
  }
}
