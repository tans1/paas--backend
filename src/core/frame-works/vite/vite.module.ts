import { Module } from '@nestjs/common';
import { ViteProjectScannerService } from './vite-project-scanner/vite-project-scanner.service';
import { ViteProjectService } from './vite-project-service';
import { ViteDockerfileService } from './vite-docker-config/vite-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';
import { ViteDockerIgnoreFileService } from './vite-docker-config/vite-dockerignorefile.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';

@Module({
  providers: [
    ViteProjectScannerService,
    ViteProjectService,
    ViteDockerfileService,
    ViteDockerIgnoreFileService,
  ],
  imports: [AlsModule, InterfacesModule],
  exports: [ViteProjectScannerService],
})
export class ViteModule {}
