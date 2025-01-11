export abstract class GithubRepositoryInterface {
  abstract create(
    userId: number,
    githubUsername: string,
    accessToken: string,
  ): any;

  abstract getAccessToken(username: string): any;
}
