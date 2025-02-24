import { Module } from '@nestjs/common';
import { CreateImageService } from './create-image/create-image.service';
import { ImageBuildGateway } from './Image-build-gateway';
import { AlsModule } from '@/utils/als/als.module';
import { FileService } from './create-image/file.service';
import { DockerLogService } from './create-image/docker-log.service';
import { ImageBuildService } from './create-image/image-build.service';
import { ContainerManagementService } from './create-image/container-management.service';
import { SourceCodeEventHandlerService } from './create-image/source-code-event-handler.service';
import { DockerPushService } from './create-image/docker-push.service';

@Module({
  providers: [
    CreateImageService,
    ImageBuildGateway,
    FileService,
    DockerLogService,
    ImageBuildService,
    ContainerManagementService,
    SourceCodeEventHandlerService,
    ImageBuildGateway,
    DockerPushService
    ],
  imports: [AlsModule],
})
export class ContainerSetupModule {}

