import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { RepositoryBootstrapService } from '../repository-bootstrap/repository-bootstrap.service';
import { RepositorySyncService } from '../repository-sync/repository-sync.service';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AlsService } from '@/utils/als/als.service';

@Injectable()
export class PushEventListenerService {
  private readonly logger = new Logger(PushEventListenerService.name);
  private readonly baseRepoPath =
    process.env.PROJECTS_BASE_PATH || path.join(process.cwd(), 'projects');

  constructor(
    private readonly repositoryBootstrapService: RepositoryBootstrapService,
    private readonly repositorySyncService: RepositorySyncService,
    private eventEmitter: EventEmitter2,
    private alsService: AlsService,
  ) {}

  @OnEvent(EventNames.PushEventReceived)
  async processProject(payload: any) {
    const { repoData, githubAccessToken } = payload;
    const repoFullName = repoData?.repository?.full_name;
    const cloneUrl = repoData?.repository?.clone_url;
    const userName = repoData?.repository?.owner?.name;
    const userEmail = repoData?.repository?.owner?.email;
    const ref = repoData.ref;
    const branch = ref.replace('refs/heads/', '');
    this.alsService.setbranchName(branch);
    if (!repoFullName || !cloneUrl) {
      this.logger.error('Invalid payload: missing repository information.');
      return;
    }

    const localRepoPath = path.join(this.baseRepoPath, repoFullName, branch);

    try {
      await this.repositorySyncService.syncRepository(
        localRepoPath,
        userName,
        userEmail,
        branch,
        githubAccessToken,
      );
      this.eventEmitter.emit(EventNames.SourceCodeReady, {
        projectPath: localRepoPath,
      });
    } catch (error) {
      this.logger.error(
        `Error processing repository ${repoFullName}: ${error.message}`,
        error.stack,
      );
    }
  }
}
