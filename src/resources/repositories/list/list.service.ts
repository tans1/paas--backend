import { Injectable } from '@nestjs/common';
import { OctokitService } from '../octokit/octokit.service';

@Injectable()
export class ListService {
  constructor(private readonly octokitService: OctokitService) {}

  async getRepoInfo(email: string, owner: string, repo: string) {
    const octokit = await this.octokitService.getOctokit(email);
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });

    return {
      message: 'Successfully fetched repository info',
      data,
    };
  }

  async getAllUserRepos(email: string) {
    const octokit = await this.octokitService.getOctokit(email);

    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
    });

    return {
      message: 'Successfully fetched user repositories',
      data,
    };
  }
}
