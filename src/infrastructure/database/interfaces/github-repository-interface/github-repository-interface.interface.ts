export abstract class GithubRepositoryInterface {
  abstract create(githubUsername: string, accessToken: string): any;

  abstract getAccessToken(username: string): any;
}
