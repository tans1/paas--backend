import { Module } from '@nestjs/common';
import { AngularProjectScannerService } from './angular-project-scanner/angular-project-scanner.service';
import { AngularProjectService } from './angular-project-service';
import { AngularDockerfileService } from './angular-docker-config/angular-dockerfile.service';
import { AlsModule } from '../../../utils/als/als.module';
import { AngularDockerIgnoreFileService } from './angular-docker-config/angular-dockerignorefile.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  providers: [
    AngularProjectScannerService,
    AngularProjectService,
    AngularDockerfileService,
    AngularDockerIgnoreFileService,
    EventEmitter2
  ],
  imports: [AlsModule, InterfacesModule],
})
export class AngularModule {}
