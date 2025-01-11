import { Module } from '@nestjs/common';
import { AdminRepositoryService } from './admin-repository/admin-repository.service';
import { AuthRepositoryService } from './auth-repository/auth-repository.service';
import { ProjectsRepositoryService } from './projects-repository/projects-repository.service';
import { ServersRepositoryService } from './servers-repository/servers-repository.service';
import { UsersRepositoryService } from './users-repository/users-repository.service';
import { PrismaModule } from '../prisma/prisma.module';

import { GithubRepositoryService } from './github-repository/github-repository.service';

@Module({
  providers: [
    AdminRepositoryService,
    AuthRepositoryService,
    ProjectsRepositoryService,
    ServersRepositoryService,
    UsersRepositoryService,
    GithubRepositoryService,
  ],
  imports: [PrismaModule],
})
export class RepositoriesModule {}
