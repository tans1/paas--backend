import { Module } from '@nestjs/common';
import { NodeProjectScannerService } from './node-project-scanner/node-project-scanner.service';
import { NodeProjectService } from './node-project-service';
import { NodeDockerfileService } from './node-dockerfile/node-dockerfile.service';

@Module({
  providers: [
    NodeProjectScannerService,
    NodeProjectService,
    NodeDockerfileService,
  ],
})
export class NodeModule {}
