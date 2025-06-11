// src/framework-detection/framework-detection.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FrameworkMap } from '../framework.config';
import { FileHandlers } from './file-handler';
import { GitHubFileService } from '../../../utils/octokit/github-services/github-file.service';

@Injectable()
export class FrameworkDetectionService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly gitHubFileService: GitHubFileService,
  ) {}

  async detectFramework(payload: {
    owner: string;
    repo: string;
    branch?: string;
    email: string;
  }) {
    try {
      const { owner, repo, branch, email } = payload;
      await this.gitHubFileService.initialize(email);
      this.gitHubFileService.setRepositoryContext(owner, repo, branch);
      return await this.detectFrameworksInParallel();
    } catch (error) {
      console.error('Framework detection failed:', error.message);
      return [];
    }
  }

  private async detectFrameworksInParallel(): Promise<string[]> {
    const frameworkChecks = Object.entries(FrameworkMap)
      .sort(([, a], [, b]) => a.sort - b.sort)
      .map(async ([frameworkKey, criteria]) => {
        try {
          const files = Array.isArray(criteria.file)
            ? criteria.file
            : [criteria.file];

          for (const file of files) {
            const { exists, content } =
              await this.gitHubFileService.getConfigFile(file);
            if (!exists) continue;

            const handler = FileHandlers[file];
            if (handler?.(content, criteria)) {
              console.log('Framework detected:', frameworkKey);
              return frameworkKey;
            }
          }
          return null;
        } catch (error) {
          console.error(`Error checking ${frameworkKey}:`, error.message);
          return null;
        }
      });

    const results = await Promise.all(frameworkChecks);
    return results.filter((r): r is string => r !== null);
  }
}
