import { Injectable } from '@nestjs/common';
import { NodeProjectScannerService } from './node-project-scanner/node-project-scanner.service';
import { Framework } from '../frameworks.enum';
import { OnEvent } from '@nestjs/event-emitter';
import { NodeDockerfileService } from './node-dockerfile/node-dockerfile.service';

@Injectable()
export class NodeProjectService {
  constructor(
    private nodeProjectScannerService: NodeProjectScannerService,
    private nodeDockerfileService: NodeDockerfileService,
  ) {}
  @OnEvent(`EventNames.FRAMEWORK_DETECTED.${Framework.NodeJS}`)
  async processNodeProject(payload: any) {
    const projectConfig = await this.nodeProjectScannerService.scan(payload);
    await this.nodeDockerfileService.createDockerfile(projectConfig);
  }
}
