import { Module } from '@nestjs/common';
import { VueProjectScannerService } from './vue-project-scanner/vue-project-scanner.service';
import { VueProjectService } from './vue-project-service';
import { VueDockerfileService } from './vue-docker-config/vue-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';
import { VueDockerIgnoreFileService } from './vue-docker-config/vue-dockerignorefile.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';

@Module({
  providers: [
    VueProjectScannerService,
    VueProjectService,
    VueDockerfileService,
    VueDockerIgnoreFileService,
  ],
  imports: [AlsModule, InterfacesModule],
})
export class VueModule {}
