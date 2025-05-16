import { Injectable } from '@nestjs/common';
import { ViteProjectScannerService } from './vite-project-scanner/vite-project-scanner.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ViteDockerfileService } from './vite-docker-config/vite-dockerfile.service';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { ViteDockerIgnoreFileService } from './vite-docker-config/vite-dockerignorefile.service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
@Injectable()
export class ViteProjectService {
  constructor(
    private viteProjectScannerService: ViteProjectScannerService,
    private viteDockerfileService: ViteDockerfileService,
    private eventEmitter: EventEmitter2,
    private viteDockerIgnoreFileService: ViteDockerIgnoreFileService,
    private alsService: AlsService,
    private projectRepositoryService: ProjectsRepositoryInterface,
  ) {}
  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.Vite.name}`)
  async processViteProject(payload: any) {
    console.log('Vite project service', payload);
    const projectConfig = await this.viteProjectScannerService.scan(payload);

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
        FrameworkMap.Vite.settings.installCommand.value,
      buildCommand:
        project.buildCommand || FrameworkMap.Vite.settings.buildCommand.value,
      outputDirectory:
        project.outputDirectory ||
        projectConfig.defaultBuildLocation ||
        FrameworkMap.Vite.settings.outputDirectory.value,
    };

    await this.viteDockerfileService.createDockerfile(extendProjectConfig);
    await this.viteDockerIgnoreFileService.addDockerIgnoreFile(projectConfig);

    const projectPath = payload.projectPath;
    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath,
    });
  }
}
