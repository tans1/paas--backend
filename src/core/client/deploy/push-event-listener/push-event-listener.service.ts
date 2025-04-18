import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { RepositoryBootstrapService } from '../repository-bootstrap/repository-bootstrap.service';
import { RepositorySyncService } from '../repository-sync/repository-sync.service';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PushEventListenerService {
  private readonly logger = new Logger(PushEventListenerService.name);
  private readonly baseRepoPath = process.env.PROJECTS_BASE_PATH || path.join(process.cwd(), 'projects');

  constructor(
    private readonly repositoryBootstrapService: RepositoryBootstrapService,
    private readonly repositorySyncService: RepositorySyncService,
    private eventEmitter : EventEmitter2
  ) {}

  @OnEvent(EventNames.PushEventReceived)
  async processNodeProject(payload: any) {
    
    const repoFullName = payload?.repository?.full_name;
    const cloneUrl = payload?.repository?.clone_url;
    const userName = payload?.repository?.owner?.name;
    const userEmail = payload?.repository?.owner?.email;
    if (!repoFullName || !cloneUrl) {
      this.logger.error('Invalid payload: missing repository information.');
      return;
    }

    const localRepoPath = path.join(this.baseRepoPath, repoFullName);

    const repoExists = fs.existsSync(localRepoPath);
    try {
      if (!repoExists) {
        this.logger.log(`Repository ${repoFullName} not found locally. Cloning...`);
        await this.repositoryBootstrapService.bootstrapRepository(cloneUrl, localRepoPath);
        this.logger.log(`Repository ${repoFullName} cloned successfully.`);
        this.eventEmitter.emit(EventNames.PROJECT_UPLOADED, { projectPath: localRepoPath });
      } else {
        this.logger.log(`Repository ${repoFullName} exists. Syncing updates...`);
        await this.repositorySyncService.syncRepository(localRepoPath,userName,userEmail);
        this.logger.log(`Repository ${repoFullName} updated successfully.`);
        this.eventEmitter.emit(EventNames.SourceCodeReady, { projectPath: localRepoPath });
      }

    } catch (error) {
      this.logger.error(
        `Error processing repository ${repoFullName}: ${error.message}`,
        error.stack,
      );
     
    }
  }
}
