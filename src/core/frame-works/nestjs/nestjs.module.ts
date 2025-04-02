import { Module } from '@nestjs/common';
import { NestJsProjectScannerService } from './nestjs-project-scanner/nestjs-project-scanner.service';
import { NestJsProjectService } from './nestjs-project-service';
import { NestJsDockerfileService } from './nestjs-dockerfile/nestjs-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';

@Module({
  providers: [
    NestJsProjectScannerService,
    NestJsProjectService,
    NestJsDockerfileService,
  ],
  imports: [AlsModule],
})
export class NestJsModule {}

