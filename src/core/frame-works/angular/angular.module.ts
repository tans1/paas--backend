import { Module } from '@nestjs/common';
import { AngularProjectScannerService } from './angular-project-scanner/angular-project-scanner.service';
import { AngularProjectService } from './angular-project-service';
import { AngularDockerfileService } from './angular-dockerfile/angular-dockerfile.service';
import { AlsModule } from '@/utils/als/als.module';

@Module({
  providers: [
    AngularProjectScannerService,
    AngularProjectService,
    AngularDockerfileService,
  ],
  imports: [AlsModule],
})
export class AngularModule {}
