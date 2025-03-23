import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-github';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['repo','user:email'], // Ensure this scope is included
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { displayName, username, emails } = profile;

    let email = emails?.[0]?.value || null;
    if (!email) {
      try {
        const emailResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        const emailData = await emailResponse.json();
        email = emailData?.find((e: any) => e.primary)?.email || null;
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to fetch user emails from GitHub: ' + error.message,
        );
      }
    }

    const user = {
      username: username ?? 'No Username Provided',
      name: displayName ?? 'Unknown',
      email: email ?? 'No Email Provided', // Include the fetched email
      accessToken: accessToken || 'No Access Token',
      refreshToken: refreshToken || 'No Refresh Token',
    };
    done(null, user);
  }
}
