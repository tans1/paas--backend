import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { FrameworkMap } from '../../framework-detector/framework.config';
import { EventNames } from '@/core/events/event.module';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { PythonDockerfileService } from './python-docker-config/python-dockerfile.service';
import { PythonDockerIgnoreFileService } from './python-docker-config/python-dockerignorefile.service';
import { PythonScannerService } from './python-scanner/python-scanner.service';

@Injectable()
export class PythonService {
  constructor(
    private eventEmitter: EventEmitter2,
    private alsService: AlsService,
    private projectRepositoryService: ProjectsRepositoryInterface,
    private fastApiDockerfileService: PythonDockerfileService,
    private fastApiDockerIgnoreFileService: PythonDockerIgnoreFileService,
    private fastApiScannerService: PythonScannerService,
  ) {}

  @OnEvent(`${EventNames.FRAMEWORK_DETECTED}.${FrameworkMap.Python.name}`)
  async processPythonProject(payload: any) {
    const repoId = this.alsService.getrepositoryId();
    const branch = this.alsService.getbranchName();
    const project = await this.projectRepositoryService.findByRepoAndBranch(
      repoId,
      branch,
    );

    const projectConfig = await this.fastApiScannerService.scan(payload);

    const extendProjectConfig = {
      ...projectConfig,
      installCommand:
        project.installCommand ||
        FrameworkMap.Python.settings.installCommand.value,
      outputDirectory:
        project.outputDirectory ||
        FrameworkMap.Python.settings.outputDirectory.value,
      runCommand: project.runCommand || FrameworkMap.Python.settings.runCommand.value,
    };

    await this.fastApiDockerfileService.createDockerfile(extendProjectConfig);
    await this.fastApiDockerIgnoreFileService.addDockerIgnoreFile(
      extendProjectConfig,
    );

    this.eventEmitter.emit(EventNames.SourceCodeReady, {
      projectPath: payload.projectPath,
      PORT: process.env.PORT || 8000,
    });
  }
}
