import { Injectable } from '@nestjs/common';
import { AngularProjectScannerService } from './angular-project-scanner/angular-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AngularDockerfileService } from './angular-docker-config/angular-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '../../events/event.module';
import { PORT } from './constants';
import { AngularDockerIgnoreFileService } from './angular-docker-config/angular-dockerignorefile.service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
@Injectable()
export class AngularProjectService {
  constructor(
    private angularProjectScannerService: AngularProjectScannerService,
    private angularDockerfileService: AngularDockerfileService,
    private angularDockerIgnoreFileService: AngularDockerIgnoreFileService,
    private eventEmitter: EventEmitter2,
    private alsService: AlsService,
    private projectRepositoryService: ProjectsRepositoryInterface,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.Angular.name}`)
  async processAngularProject(payload: any) {
    console.log('Angular project service', payload);
    const projectConfig = await this.angularProjectScannerService.scan(payload);

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
        FrameworkMap.Angular.settings.installCommand.value,
      buildCommand:
        project.buildCommand ||
        FrameworkMap.Angular.settings.buildCommand.value,
      outputDirectory:
        project.outputDirectory ||
        projectConfig.defaultBuildLocation ||
        FrameworkMap.Angular.settings.outputDirectory.value,
    };

    await this.angularDockerfileService.createDockerfile(extendProjectConfig);
    await this.angularDockerIgnoreFileService.addDockerIgnoreFile(
      projectConfig,
    );
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
      PORT: PORT,
    });
  }
}
