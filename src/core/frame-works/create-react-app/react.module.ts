import { Module } from '@nestjs/common';
import { CRAProjectScannerService } from './cra-project-scanner/cra-project-scanner.service';
import { CRAProjectService } from './cra-project-service';
import { CRADockerfileService } from './cra-docker-config/cra-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';
import { CRADockerIgnoreFileService } from './cra-docker-config/cra-dockerignorefile.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';

@Module({
  providers: [
    CRAProjectScannerService,
    CRAProjectService,
    CRADockerfileService,
    CRADockerIgnoreFileService,
  ],
  imports: [AlsModule, InterfacesModule],
  exports: [CRAProjectScannerService],
})
export class CRAModule {}
