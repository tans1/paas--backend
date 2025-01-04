import { Injectable } from '@nestjs/common';

@Injectable()
export class GithubService {
  githubLogin(req) {
    if (!req.user) {
      return 'No user from github';
    }

    return {
      message: 'User information from github',
      user: req.user,
    };
  }
}