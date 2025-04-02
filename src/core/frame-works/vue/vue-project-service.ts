import { Injectable } from '@nestjs/common';
import { VueProjectScannerService } from './vue-project-scanner/vue-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { VueDockerfileService } from './vue-dockerfile/vue-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
@Injectable()
export class VueProjectService {
  constructor(
    private vueProjectScannerService: VueProjectScannerService,
    private vueDockerfileService: VueDockerfileService,
    private eventEmitter: EventEmitter2,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.Vue.name}`)
  async processVueProject(payload: any) {
    console.log('Vue project service', payload);
    const projectConfig = await this.vueProjectScannerService.scan(payload);
    await this.vueDockerfileService.createDockerfile(projectConfig);
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
    });
  }
}
