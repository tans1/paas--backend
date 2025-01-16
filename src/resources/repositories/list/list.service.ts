import { Injectable } from '@nestjs/common';
import { OctokitService } from '../octokit/octokit.service';

@Injectable()
export class ListService {
  constructor(private readonly octokitService: OctokitService) {}

  async getRepoInfo(githubUsername: string, owner: string, repo: string) {
    const octokit = await this.octokitService.getOctokit(githubUsername);
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });

    return {
      message: 'Successfully fetched repository info',
      data,
    };
  }

  async getAllUserRepos(githubUsername: string) {
    const octokit = await this.octokitService.getOctokit(githubUsername);

    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
    });

    return {
      message: 'Successfully fetched user repositories',
      data,
    };
  }
}
