import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../../resources/users/users.service';

@Injectable()
export class OctokitService {
  constructor(private readonly usersService: UsersService) {}

  public async getOctokit(email: string): Promise<any> {
    //  get the accesstoken from the user table with the user githubUsername : username
    const user = await this.usersService.findOneBy(email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.githubAccessToken) {
      throw new BadRequestException('GitHub access token not available');
    }

    // Dynamically import Octokit from @octokit/rest
    const { Octokit } = await import('@octokit/rest');

    // Create and return a new instance of Octokit with the provided auth token
    return new Octokit({ auth: user.githubAccessToken });
  }
}
