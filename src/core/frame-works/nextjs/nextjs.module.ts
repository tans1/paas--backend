import { Module } from '@nestjs/common';
import { NextJsProjectScannerService } from './nextjs-project-scanner/nextjs-project-scanner.service';
import { NextJsProjectService } from './nextjs-project-service';
import { NextJsDockerfileService } from './nextjs-docker-config/nextjs-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';
import { NextJsDockerIgnoreFileService } from './nextjs-docker-config/nextjs-dockerignorefile.service';

@Module({
  providers: [
    NextJsProjectScannerService,
    NextJsProjectService,
    NextJsDockerfileService,
    NextJsDockerIgnoreFileService,
  ],
  imports: [AlsModule],
})
export class NextJsModule {}
