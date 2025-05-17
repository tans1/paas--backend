import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { InterfacesModule } from '../../infrastructure/database/interfaces/interfaces.module';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  imports: [InterfacesModule],
  exports: [ProjectsService],
})
export class ProjectsModule {}
