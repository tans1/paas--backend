import { Injectable } from '@nestjs/common';
import { ReactProjectScannerService } from './react-project-scanner/react-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ReactDockerfileService } from './react-docker-config/react-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { ReactDockerIgnoreFileService } from './react-docker-config/react-dockerignorefile.service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
@Injectable()
export class ReactProjectService {
  constructor(
    private reactProjectScannerService: ReactProjectScannerService,
    private reactDockerfileService: ReactDockerfileService,
    private eventEmitter: EventEmitter2,
    private reactDockerIgnoreFileService: ReactDockerIgnoreFileService,
    private alsService: AlsService,
    private projectRepositoryService: ProjectsRepositoryInterface,
  ) {}
  @OnEvent(
    `${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.React.name}`,
  )
  async processReactProject(payload: any) {
    console.log('React project service', payload);
    const projectConfig = await this.reactProjectScannerService.scan(payload);

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
        FrameworkMap.React.settings.installCommand.value,
      buildCommand:
        project.buildCommand || FrameworkMap.React.settings.buildCommand.value,
      outputDirectory:
        project.outputDirectory ||
        projectConfig.defaultBuildLocation ||
        FrameworkMap.React.settings.outputDirectory.value,
    };

    await this.reactDockerfileService.createDockerfile(extendProjectConfig);
    await this.reactDockerIgnoreFileService.addDockerIgnoreFile(projectConfig);

    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
    });
  }
}
