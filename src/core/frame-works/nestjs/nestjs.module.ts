import { Module } from '@nestjs/common';
import { NestJsProjectScannerService } from './nestjs-project-scanner/nestjs-project-scanner.service';
import { NestJsProjectService } from './nestjs-project-service';
import { NestJsDockerfileService } from './nestjs-docker-config/nestjs-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';
import { NestJsDockerIgnoreFileService } from './nestjs-docker-config/nestjs-dockerignorefile.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';

@Module({
  providers: [
    NestJsProjectScannerService,
    NestJsProjectService,
    NestJsDockerfileService,
    NestJsDockerIgnoreFileService,
  ],
  imports: [AlsModule, InterfacesModule],
})
export class NestJsModule {}
