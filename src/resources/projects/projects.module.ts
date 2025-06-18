import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { InterfacesModule } from '../../infrastructure/database/interfaces/interfaces.module';
import { ContainerSetupModule } from '@/core/container-setup/container-setup.module';
import { ManageContainerService } from '@/core/container-setup/manage-containers/manage-containers.service';
import { ManageProjectService } from './manage-project/manage-project.service';
import { AlsModule } from '@/utils/als/als.module';
import { EnvironmentModule } from '@/utils/environment/environment.module';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ManageProjectService
  ],
  imports: [
    InterfacesModule,
    ContainerSetupModule,
    AlsModule,
    EnvironmentModule
  ],
  exports: [
    ProjectsService,
    ManageProjectService
  ],
})
export class ProjectsModule {}
