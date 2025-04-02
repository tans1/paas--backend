import { Module } from '@nestjs/common';
import { VueProjectScannerService } from './vue-project-scanner/vue-project-scanner.service';
import { VueProjectService } from './vue-project-service';
import { VueDockerfileService } from './vue-dockerfile/vue-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';

@Module({
  providers: [
    VueProjectScannerService,
    VueProjectService,
    VueDockerfileService,
  ],
  imports: [AlsModule],
})
export class VueModule {}
