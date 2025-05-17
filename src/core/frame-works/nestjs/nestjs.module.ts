import { Module } from '@nestjs/common';
import { NestJsProjectScannerService } from './nestjs-project-scanner/nestjs-project-scanner.service';
import { NestJsProjectService } from './nestjs-project-service';
import { NestJsDockerfileService } from './nestjs-docker-config/nestjs-dockerfile.service';
import { AlsModule } from '../../../utils/als/als.module';
import { NestJsDockerIgnoreFileService } from './nestjs-docker-config/nestjs-dockerignorefile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  providers: [
    NestJsProjectScannerService,
    NestJsProjectService,
    NestJsDockerfileService,
    NestJsDockerIgnoreFileService,
    EventEmitter2,
  ],
  imports: [AlsModule],
  exports: [NestJsProjectScannerService],
})
export class NestJsModule {}
