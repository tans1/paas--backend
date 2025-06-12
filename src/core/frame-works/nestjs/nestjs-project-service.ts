import { Injectable } from '@nestjs/common';
import { NestJsProjectScannerService } from './nestjs-project-scanner/nestjs-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NestJsDockerfileService } from './nestjs-docker-config/nestjs-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '../../events/event.module';
import { NestJsDockerIgnoreFileService } from './nestjs-docker-config/nestjs-dockerignorefile.service';
import { PORT } from './constants';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
@Injectable()
export class NestJsProjectService {
  constructor(
    private nestJsProjectScannerService: NestJsProjectScannerService,
    private nestJsDockerfileService: NestJsDockerfileService,
    private eventEmitter: EventEmitter2,
    private nestJsDocerIgnoreFileService: NestJsDockerIgnoreFileService,
    private alsService: AlsService,
    private projectRepositoryService: ProjectsRepositoryInterface,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.NestJS.name}`)
  async processVueProject(payload: any) {
    const projectConfig = await this.nestJsProjectScannerService.scan(payload);

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
        FrameworkMap.NestJS.settings.installCommand.value,
      buildCommand:
        project.buildCommand || FrameworkMap.NestJS.settings.buildCommand.value,
      outputDirectory:
        project.outputDirectory ||
        FrameworkMap.NestJS.settings.outputDirectory.value,
      runCommand: FrameworkMap.NestJS.settings.runCommand.value,
    };

    await this.nestJsDockerfileService.createDockerfile(extendProjectConfig);
    await this.nestJsDocerIgnoreFileService.addDockerIgnoreFile(projectConfig);
    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
      PORT,
    });
  }
}
