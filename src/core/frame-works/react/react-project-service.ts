import { Injectable } from '@nestjs/common';
import { ReactProjectScannerService } from './react-project-scanner/react-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ReactDockerfileService } from './react-dockerfile/react-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
@Injectable()
export class ReactProjectService {
  constructor(
    private reactProjectScannerService: ReactProjectScannerService,
    private reactDockerfileService: ReactDockerfileService,
    private eventEmitter: EventEmitter2,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.React.name}`) 
  async processReactProject(payload: any) {
    console.log('React project service', payload);
    const projectConfig = await this.reactProjectScannerService.scan(payload);
    await this.reactDockerfileService.createDockerfile(projectConfig);
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
    });
  }
}
