import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-github';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/oauth/github-redirect',
      scope: ['user:email'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { displayName, username } = profile;
    const user = {
      username: username ?? "No Email Provided",
      name: displayName ?? "Unknown",
      accessToken: accessToken || "No Access Token",
      refreshToken: refreshToken || "No Refresh Token",
    };
    done(null, user);
  }
}