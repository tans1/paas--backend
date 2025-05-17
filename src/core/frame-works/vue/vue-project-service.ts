import { Injectable } from '@nestjs/common';
import { VueProjectScannerService } from './vue-project-scanner/vue-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { VueDockerfileService } from './vue-docker-config/vue-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { VueDockerIgnoreFileService } from './vue-docker-config/vue-dockerignorefile.service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { PORT } from './constants';
@Injectable()
export class VueProjectService {
  constructor(
    private vueProjectScannerService: VueProjectScannerService,
    private vueDockerfileService: VueDockerfileService,
    private eventEmitter: EventEmitter2,
    private vueDockerIgnoreFileService: VueDockerIgnoreFileService,
    private alsService: AlsService,
    private projectRepositoryService: ProjectsRepositoryInterface,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.Vue.name}`)
  async processVueProject(payload: any) {
    console.log('Vue project service', payload);
    const projectConfig = await this.vueProjectScannerService.scan(payload);

    const repoId = this.alsService.getrepositoryId();
    const branch = this.alsService.getbranchName();
    const project = await this.projectRepositoryService.findByRepoAndBranch(
      repoId,
      branch,
    );
    let extendProjectConfig = {
      ...projectConfig,
      installCommand:
        project.installCommand ||
        FrameworkMap.Vue.settings.installCommand.value,
      buildCommand:
        project.buildCommand || FrameworkMap.Vue.settings.buildCommand.value,
      outputDirectory:
        project.outputDirectory ||
        projectConfig.defaultBuildLocation ||
        FrameworkMap.Vue.settings.outputDirectory.value,
    };

    await this.vueDockerfileService.createDockerfile(extendProjectConfig);
    await this.vueDockerIgnoreFileService.addDockerIgnoreFile(projectConfig);
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
      PORT: PORT,
    });
  }
}
