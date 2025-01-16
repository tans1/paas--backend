import { GithubAuth } from '@prisma/client';

export abstract class GithubRepositoryInterface {
  abstract create(
    githubUsername: string,
    accessToken: string,
  ): Promise<GithubAuth>;

  abstract getAccessToken(username: string): Promise<string | null>;
}
