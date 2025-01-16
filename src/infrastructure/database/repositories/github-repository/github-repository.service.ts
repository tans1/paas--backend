import { Injectable } from '@nestjs/common';
import { GithubRepositoryInterface } from '../../interfaces/github-repository-interface/github-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import { GithubAuth } from '@prisma/client';

@Injectable()
export class GithubRepositoryService implements GithubRepositoryInterface {
  constructor(private prisma: PrismaService) {}

  public async create(
    githubUsername: string,
    accessToken: string,
  ): Promise<GithubAuth> {
    return await this.prisma.githubAuth.create({
      data: {
        githubUsername,
        accessToken,
      },
    });
  }

  public async getAccessToken(username: string): Promise<string | null> {
    const githubAuth = await this.prisma.githubAuth.findUnique({
      where: {
        githubUsername: username,
      },
    });
    if (githubAuth) {
      return githubAuth.accessToken;
    }

    return null;
  }
}
