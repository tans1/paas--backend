import { Injectable } from '@nestjs/common';
import { GithubRepositoryInterface } from '../../interfaces/github-repository-interface/github-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';

@Injectable()
export class GithubRepositoryService implements GithubRepositoryInterface {
  constructor(private prisma: PrismaService) {}
  async create(githubUsername: string, accessToken: string) {
    return await this.prisma.githubAuth.create({
      data: {
        githubUsername,
        accessToken,
      },
    });
  }

  async getAccessToken(username: string) {
    return await this.prisma.githubAuth.findUnique({
      where: {
        githubUsername: username,
      },
    });
  }
}
