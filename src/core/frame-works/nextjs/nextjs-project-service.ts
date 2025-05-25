import { Injectable } from '@nestjs/common';
import { NextJsProjectScannerService } from './nextjs-project-scanner/nextjs-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NextJsDockerfileService } from './nextjs-docker-config/nextjs-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { PORT } from './constants';
import { NextJsDockerIgnoreFileService } from './nextjs-docker-config/nextjs-dockerignorefile.service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
@Injectable()
export class NextJsProjectService {
  constructor(
    private nextjsProjectScannerService: NextJsProjectScannerService,
    private nextjsDockerfileService: NextJsDockerfileService,
    private nextjsDockerIgnoreFileService: NextJsDockerIgnoreFileService,
    private eventEmitter: EventEmitter2,
    private alsService: AlsService,
    private projectRepositoryService: ProjectsRepositoryInterface
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.NextJs.name}`)
  async processNextJsProject(payload: any) {
    console.log('NextJs project service', payload);
    const projectConfig = await this.nextjsProjectScannerService.scan(payload);

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
        FrameworkMap.NextJs.settings.installCommand.value,
      buildCommand:
        project.buildCommand || FrameworkMap.NextJs.settings.buildCommand.value,
      outputDirectory:
        projectConfig.distDir ||
        project.outputDirectory ||
        FrameworkMap.NextJs.settings.outputDirectory.value,
      runCommand: FrameworkMap.NextJs.settings.runCommand.value,
    };


    await this.nextjsDockerfileService.createDockerfile(extendProjectConfig);
    await this.nextjsDockerIgnoreFileService.addDockerIgnoreFile(projectConfig);
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
      PORT: PORT,
    });
  }
}
