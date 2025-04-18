import { Module } from '@nestjs/common';
import { AngularProjectScannerService } from './angular-project-scanner/angular-project-scanner.service';
import { AngularProjectService } from './angular-project-service';
import { AngularDockerfileService } from './angular-docker-config/angular-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';
import { AngularDockerIgnoreFileService } from './angular-docker-config/angular-dockerignorefile.service';

@Module({
  providers: [
    AngularProjectScannerService,
    AngularProjectService,
    AngularDockerfileService,
    AngularDockerIgnoreFileService
  ],
  imports: [AlsModule],
})
export class AngularModule {}
