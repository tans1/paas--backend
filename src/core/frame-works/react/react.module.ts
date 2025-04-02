import { Module } from '@nestjs/common';
import { ReactProjectScannerService } from './react-project-scanner/react-project-scanner.service';
import { ReactProjectService } from './react-project-service';
import { ReactDockerfileService } from './react-dockerfile/react-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';

@Module({
  providers: [
    ReactProjectScannerService,
    ReactProjectService,
    ReactDockerfileService,
  ],
  imports: [AlsModule],
  exports : [ReactProjectScannerService]
})
export class ReactModule {}
