import { Module } from '@nestjs/common';
import { VueProjectScannerService } from './vue-project-scanner/vue-project-scanner.service';
import { VueProjectService } from './vue-project-service';
import { VueDockerfileService } from './vue-docker-config/vue-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';
import { VueDockerIgnoreFileService } from './vue-docker-config/vue-dockerignorefile.service';

@Module({
  providers: [
    VueProjectScannerService,
    VueProjectService,
    VueDockerfileService,
    VueDockerIgnoreFileService
  ],
  imports: [AlsModule],
})
export class VueModule {}
