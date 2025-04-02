import { Injectable } from '@nestjs/common';
import { NestJsProjectScannerService } from './nestjs-project-scanner/nestjs-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NestJsDockerfileService } from './nestjs-dockerfile/nestjs-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
@Injectable()
export class NestJsProjectService {
  constructor(
    private nestJsProjectScannerService: NestJsProjectScannerService,
    private nestJsDockerfileService: NestJsDockerfileService,
    private eventEmitter: EventEmitter2,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.NestJS.name}`)
  async processVueProject(payload: any) {
    const projectConfig = await this.nestJsProjectScannerService.scan(payload);
    await this.nestJsDockerfileService.createDockerfile(projectConfig);
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
    });
  }
}
