import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { DockerfileScannerService } from './dockerfile-scanner/dockerfile-scanner.service';
@Injectable()
export class DockerService {
  constructor(
    private eventEmitter: EventEmitter2,
    private dockerfileScannerService: DockerfileScannerService,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.Docker.name}`)
  async processVueProject(payload: any) {
    const projectConfig = await this.dockerfileScannerService.scan(payload);
    const projectPath = payload.projectPath;
    const { PORT } = projectConfig;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
      PORT,
      dockerFile: 'Dockerfile',
    });
  }
}
