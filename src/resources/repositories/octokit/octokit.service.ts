import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class OctokitService {
  constructor(private readonly usersService: UsersService) {}

  public async getOctokit(email: string): Promise<any> {
    //  get the accesstoken from the user table with the user githubUsername : username
    const user = await this.usersService.findOneBy(email);
    const accessToken = user.githubAccessToken;

    // Dynamically import Octokit from @octokit/rest
    const { Octokit } = await import('@octokit/rest');

    // Create and return a new instance of Octokit with the provided auth token
    return new Octokit({ auth: accessToken });
  }
}
