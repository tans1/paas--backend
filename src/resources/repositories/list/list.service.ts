import { Injectable } from '@nestjs/common';
import { OctokitService } from '../utils/octokit';

@Injectable()
export class ListService {
  constructor(private readonly octokitService: OctokitService) {}

  async getRepoInfo(username: string, owner: string, repo: string) {
    const octokit = await this.octokitService.getOctokit(username);
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });

    return data;
  }

  async getAllUserRepos(username: string) {
    const octokit = await this.octokitService.getOctokit(username);

    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
    });

    return data;
  }
}
