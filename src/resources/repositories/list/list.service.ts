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
    try {
      const octokit = await this.octokitService.getOctokit(email);
      
      const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
        per_page: 100,
      });
  
      const reposWithBranches = await Promise.all(
        repos.map(async repo => {
          try {
            const branches = await octokit.paginate(
              octokit.repos.listBranches,
              {
                owner: repo.owner.login,
                repo: repo.name,
                per_page: 100,
              }
            );
            return {
              ...repo,
              branches: branches.map(branch => branch.name),
            };
          } catch (error) {
            console.error(`Error fetching branches for ${repo.full_name}:`, error);
            return {
              ...repo,
              branches: [],
              error: 'Failed to fetch branches',
            };
          }
        })
      );
  
      return {
        message: 'Successfully fetched user repositories with branches',
        data: reposWithBranches,
      };
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      throw new Error('Failed to fetch user repositories: ' + error.message);
    }
  }
}
