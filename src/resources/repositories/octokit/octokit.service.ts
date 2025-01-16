import { Injectable } from '@nestjs/common';

import { Octokit } from '@octokit/rest';

import { GithubRepositoryInterface } from '@/infrastructure/database/interfaces/github-repository-interface/github-repository-interface.interface';

@Injectable()
export class OctokitService {
  constructor(private readonly githubRepository: GithubRepositoryInterface) {}

  public async getOctokit(username: string): Promise<Octokit> {
    const accessToken = await this.githubRepository.getAccessToken(username);

    return new Octokit({ auth: accessToken });
  }
}
