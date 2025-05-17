import { Injectable } from '@nestjs/common';
import { NextJsProjectScannerService } from './nextjs-project-scanner/nextjs-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NextJsDockerfileService } from './nextjs-docker-config/nextjs-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { PORT } from './constants';
import { NextJsDockerIgnoreFileService } from './nextjs-docker-config/nextjs-dockerignorefile.service';
@Injectable()
export class NextJsProjectService {
  constructor(
    private nextjsProjectScannerService: NextJsProjectScannerService,
    private nextjsDockerfileService: NextJsDockerfileService,
    private nextjsDockerIgnoreFileService: NextJsDockerIgnoreFileService,
    private eventEmitter: EventEmitter2,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.NextJs.name}`)
  async processNextJsProject(payload: any) {
    console.log('NextJs project service', payload);
    const projectConfig = await this.nextjsProjectScannerService.scan(payload);
    await this.nextjsDockerfileService.createDockerfile(projectConfig);
    await this.nextjsDockerIgnoreFileService.addDockerIgnoreFile(projectConfig);
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
      PORT: PORT,
    });
  }
}
