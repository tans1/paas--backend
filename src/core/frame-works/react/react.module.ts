import { Module } from '@nestjs/common';
import { ReactProjectScannerService } from './react-project-scanner/react-project-scanner.service';
import { ReactProjectService } from './react-project-service';
import { ReactDockerfileService } from './react-docker-config/react-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';
import { ReactDockerIgnoreFileService } from './react-docker-config/react-dockerignorefile.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';

@Module({
  providers: [
    ReactProjectScannerService,
    ReactProjectService,
    ReactDockerfileService,
    ReactDockerIgnoreFileService,
  ],
  imports: [AlsModule, InterfacesModule],
  exports: [ReactProjectScannerService],
})
export class ReactModule {}
