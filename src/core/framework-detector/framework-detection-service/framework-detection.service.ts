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
      return []; // Return empty array on error
    }
  }

  private async detectFrameworksInParallel(): Promise<string[]> {
    const frameworkChecks = Object.entries(FrameworkMap).map(
      async ([frameworkKey, criteria]) => {
        try {
          const { exists, content } = await this.gitHubFileService.getConfigFile(criteria.file);
          if (!exists) return null;

          const handler = FileHandlers[criteria.file];
          const isDetected = handler?.(content, criteria);
          
          if (isDetected) {
            console.log('Framework detected:', frameworkKey);
            return frameworkKey;
          }
          return null;
        } catch (error) {
          console.error(`Error checking ${frameworkKey}:`, error.message);
          return null;
        }
      },
    );

    const results = await Promise.all(frameworkChecks);
    // Use flatMap to filter out null values and ensure string[] type
    return results.flatMap(framework => framework ? [framework] : []);
  }
}