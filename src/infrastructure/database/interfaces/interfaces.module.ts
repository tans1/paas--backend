import { Module } from '@nestjs/common';

import { AdminRepositoryService } from '../repositories/admin-repository/admin-repository.service';
import { AuthRepositoryService } from '../repositories/auth-repository/auth-repository.service';
import { ProjectsRepositoryService } from '../repositories/projects-repository/projects-repository.service';
import { ServersRepositoryService } from '../repositories/servers-repository/servers-repository.service';
import { UsersRepositoryService } from '../repositories/users-repository/users-repository.service';
import { AdminRepositoryInterface } from '../interfaces/admin-repository-interface/admin-repository-interface.interface';
import { AuthRepositoryInterface } from '../interfaces/auth-repository-interface/auth-repository-interface.interface';
import { ProjectsRepositoryInterface } from '../interfaces/projects-repository-interface/projects-repository-interface.interface';
import { ServersRepositoryInterface } from '../interfaces/servers-repository-interface/servers-repository-interface.interface';
import { UsersRepositoryInterface } from '../interfaces/users-repository-interface/users-repository-interface.interface';
import { PrismaModule } from '../prisma/prisma.module';
import { RepositoriesModule } from '../repositories/repositories.module';
// import { GithubRepositoryInterface } from './github-repository-interface/github-repository-interface.interface';
// import { GithubRepositoryService } from '../repositories/github-repository/github-repository.service';
import { DeploymentRepositoryInterface } from './deployment-repository-interface/deployment-repository-interface.interface';
import { DeploymentRepositoryService } from '../repositories/deployment-repository/deployment-repository.service';
import { NotificationPreferencesRepositoryInterface } from '@/infrastructure/database/interfaces/notification-preferences-repository-interface/notification-preferences-repository-interface.interface';
import { NotificationRepositoryInterface } from '@/infrastructure/database/interfaces/notification-repository-interface/notification-repository-interface.interface';
import { NotificationPreferencesRepositoryService } from '../repositories/notification-preferences-repository/notification-preferences-repository.service';
import { NotificationRepositoryService } from '../repositories/notification-repository/notification-repository.service';

@Module({
  imports: [RepositoriesModule, PrismaModule],
  providers: [
    {
      provide: AdminRepositoryInterface,
      useClass: AdminRepositoryService,
    },

    {
      provide: AuthRepositoryInterface,
      useClass: AuthRepositoryService,
    },
    {
      provide: ProjectsRepositoryInterface,
      useClass: ProjectsRepositoryService,
    },
    {
      provide: ServersRepositoryInterface,
      useClass: ServersRepositoryService,
    },
    {
      provide: UsersRepositoryInterface,
      useClass: UsersRepositoryService,
    },
    {
      provide: DeploymentRepositoryInterface,
      useClass: DeploymentRepositoryService,
    },
    {
      provide: NotificationPreferencesRepositoryInterface,
      useClass: NotificationPreferencesRepositoryService,
    },
    {
      provide: NotificationRepositoryInterface,
      useClass: NotificationRepositoryService,
    },
  ],
  exports: [
    AdminRepositoryInterface,
    AuthRepositoryInterface,
    ProjectsRepositoryInterface,
    ServersRepositoryInterface,
    UsersRepositoryInterface,
    // GithubRepositoryInterface,
    DeploymentRepositoryInterface,
    NotificationPreferencesRepositoryInterface,
    NotificationRepositoryInterface

  ],
})
export class InterfacesModule {}
