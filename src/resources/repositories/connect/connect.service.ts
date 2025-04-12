import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  CallBackFailedException,
  TokenNotFoundException,
} from '@/utils/exceptions/github.exception';

import { UsersService } from '../../users/users.service';

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

@Injectable()
export class ConnectService {
  constructor(private readonly usersService: UsersService) {}
  redirectToGitHubAuth() {
    const redirectUri =
      'https://github.com/login/oauth/authorize' +
      `?client_id=${process.env.DEP_GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.DEP_GITHUB_REDIRECT_URL)}` +
      `&scope=repo,user:email`;

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
      let email = userInfo.data.email;
      if (!email) {
        const emailsResponse = await axios.get<GitHubEmail[]>(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `token ${accessToken}`,
            },
          },
        );
        // Get the primary email (or the first verified email if none is marked primary)
        const primaryEmail = emailsResponse.data.find(
          (e) => e.primary && e.verified,
        );
        email = primaryEmail
          ? primaryEmail.email
          : emailsResponse.data[0]?.email;
      }
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
