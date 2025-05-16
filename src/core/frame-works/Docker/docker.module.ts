import { Module } from '@nestjs/common';
import { DockerfileScannerService } from './dockerfile-scanner/dockerfile-scanner.service';
import { DockerService } from './docker-service';
import { AlsModule } from '@/utils/als/als.module';

@Module({
  providers: [DockerService, DockerfileScannerService],
  imports: [AlsModule],
})
export class DockerModule {}
