import { Injectable } from '@nestjs/common';
import { AngularProjectScannerService } from './angular-project-scanner/angular-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AngularDockerfileService } from './angular-docker-config/angular-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '../../events/event.module';
import { PORT } from './constants';
import { AngularDockerIgnoreFileService } from './angular-docker-config/angular-dockerignorefile.service';
@Injectable()
export class AngularProjectService {
  constructor(
    private angularProjectScannerService: AngularProjectScannerService,
    private angularDockerfileService: AngularDockerfileService,
    private angularDockerIgnoreFileService: AngularDockerIgnoreFileService,
    private eventEmitter: EventEmitter2,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.Angular.name}`)
  async processAngularProject(payload: any) {
    console.log('Angular project service', payload);
    const projectConfig = await this.angularProjectScannerService.scan(payload);
    await this.angularDockerfileService.createDockerfile(projectConfig);
    await this.angularDockerIgnoreFileService.addDockerIgnoreFile(projectConfig);
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
      PORT: PORT,
    });
  }
}
