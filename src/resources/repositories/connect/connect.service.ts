import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  CallBackFailedException,
  TokenNotFoundException,
} from '@/utils/exceptions/github.exception';

import { GithubRepositoryInterface } from '@/infrastructure/database/interfaces/github-repository-interface/github-repository-interface.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ConnectService {
  constructor(
    private readonly githubRepository: GithubRepositoryInterface,
    private readonly usersService: UsersService,
  ) {}
  redirectToGitHubAuth() {
    const redirectUri =
      'https://github.com/login/oauth/authorize' +
      `?client_id=${process.env.DEP_GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.DEP_GITHUB_REDIRECT_URL)}` +
      `&scope=repo`;

    return redirectUri;
  }

  async handleGitHubCallback(code: string) {
    try {
      interface GitHubTokenResponse {
        access_token: string;
        token_type: string;
        scope: string;
      }

      const tokenResponse = await axios.post<GitHubTokenResponse>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.DEP_GITHUB_CLIENT_ID,
          client_secret: process.env.DEP_GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: { Accept: 'application/json' },
        },
      );

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        throw new TokenNotFoundException();
      }

      interface GitHubUser {
        login: string;
        id: number;
        email: string;
      }

      const userInfo = await axios.get<GitHubUser>(
        'https://api.github.com/user',
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        },
      );

      const githubUsername = userInfo.data.login;
      const email = userInfo.data.email;
      // await this.githubRepository.create(githubUsername, accessToken);
      await this.usersService.updateByEmail(email, {
        githubUsername,
        githubAccessToken: accessToken,
      });
      return {
        message: 'Successfully connected to GitHub',
        data: {
          githubUsername,
        },
      };
    } catch (error) {
      console.error(error);
      throw new CallBackFailedException();
    }
  }
}
