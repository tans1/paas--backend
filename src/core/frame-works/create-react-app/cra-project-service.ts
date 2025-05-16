import { Injectable } from '@nestjs/common';
import { CRAProjectScannerService } from './cra-project-scanner/cra-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CRADockerfileService } from './cra-docker-config/cra-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { CRADockerIgnoreFileService } from './cra-docker-config/cra-dockerignorefile.service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
@Injectable()
export class CRAProjectService {
  constructor(
    private craProjectScannerService: CRAProjectScannerService,
    private craDockerfileService: CRADockerfileService,
    private eventEmitter: EventEmitter2,
    private craDockerIgnoreFileService: CRADockerIgnoreFileService,
    private alsService: AlsService,
    private projectRepositoryService: ProjectsRepositoryInterface,
  ) {}
  @OnEvent(
    `${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.CreateReactApp.name}`,
  )
  async processCRAProject(payload: any) {
    console.log('CreateReactApp project service', payload);
    const projectConfig = await this.craProjectScannerService.scan(payload);

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
        FrameworkMap.CreateReactApp.settings.installCommand.value,
      buildCommand:
        project.buildCommand ||
        FrameworkMap.CreateReactApp.settings.buildCommand.value,
      outputDirectory:
        project.outputDirectory ||
        projectConfig.defaultBuildLocation ||
        FrameworkMap.CreateReactApp.settings.outputDirectory.value,
    };

    await this.craDockerfileService.createDockerfile(extendProjectConfig);
    await this.craDockerIgnoreFileService.addDockerIgnoreFile(projectConfig);

    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
    });
  }
}
