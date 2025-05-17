import { Injectable } from '@nestjs/common';
import { ReactProjectScannerService } from './react-project-scanner/react-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ReactDockerfileService } from './react-docker-config/react-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '../../events/event.module';
import { ReactDockerIgnoreFileService } from './react-docker-config/react-dockerignorefile.service';
@Injectable()
export class ReactProjectService {
  constructor(
    private reactProjectScannerService: ReactProjectScannerService,
    private reactDockerfileService: ReactDockerfileService,
    private eventEmitter: EventEmitter2,
    private reactDockerIgnoreFileService: ReactDockerIgnoreFileService,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.React.name}`)
  async processReactProject(payload: any) {
    console.log('React project service', payload);
    const projectConfig = await this.reactProjectScannerService.scan(payload);
    await this.reactDockerfileService.createDockerfile(projectConfig);
    await this.reactDockerIgnoreFileService.addDockerIgnoreFile(projectConfig)
    
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
    });
  }
}
