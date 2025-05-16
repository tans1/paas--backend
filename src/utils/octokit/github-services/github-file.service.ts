// src/github/github-file.service.ts
import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { OctokitService } from '../octokit.service';

@Injectable()
export class GitHubFileService {
  private octokit: Octokit;
  private repoContext: {
    owner: string;
    repo: string;
    branch: string;
  };

  constructor(private octokitService: OctokitService) {}
  async initialize(email?: string) {
    this.octokit = await this.octokitService.getOctokit(email);
    return this;
  }

  setRepositoryContext(owner: string, repo: string, branch?: string) {
    this.repoContext = { owner, repo, branch };
  }

  async getConfigFile(filePath: string): Promise<{
    exists: boolean;
    content?: string;
  }> {
    if (!this.octokit || !this.repoContext) {
      throw new Error(
        'Service not initialized. Call initialize() and setRepositoryContext() first',
      );
    }

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.repoContext.owner,
        repo: this.repoContext.repo,
        path: filePath,
        ref: this.repoContext.branch,
        mediaType: { format: 'raw' },
      });
      return { exists: true, content: data as unknown as string };
    } catch (error) {
      if (error.status === 404) return { exists: false };
      throw new Error(`Failed to fetch config file: ${error.message}`);
    }
  }
}
