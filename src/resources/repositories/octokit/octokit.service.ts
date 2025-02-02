import { Injectable } from '@nestjs/common';
import { GithubRepositoryInterface } from '@/infrastructure/database/interfaces/github-repository-interface/github-repository-interface.interface';

@Injectable()
export class OctokitService {
  constructor(private readonly githubRepository: GithubRepositoryInterface) {}

  public async getOctokit(username: string): Promise<any> {
    const accessToken = await this.githubRepository.getAccessToken(username);

    // Dynamically import Octokit from @octokit/rest
    const { Octokit } = await import('@octokit/rest');

    // Create and return a new instance of Octokit with the provided auth token
    return new Octokit({ auth: accessToken });
  }
}
