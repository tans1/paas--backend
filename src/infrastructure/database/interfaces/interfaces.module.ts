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
import { Prisma } from '@prisma/client';
import { PrismaModule } from '../prisma/prisma.module';
import { RepositoriesModule } from '../repositories/repositories.module';


@Module({
    imports: [RepositoriesModule, PrismaModule],
  providers: [{
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
    ],
    exports: [
        AdminRepositoryInterface, 
        AuthRepositoryInterface, 
        ProjectsRepositoryInterface, 
        ServersRepositoryInterface, 
        UsersRepositoryInterface
    ]
})
export class InterfacesModule {}
