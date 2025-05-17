import { Module } from '@nestjs/common';
// import { CreateImageService } from './create-image/create-image.service';
import { ImageBuildGateway } from './Image-build-gateway';
import { AlsModule } from '../../utils/als/als.module';
import { FileService } from './create-image/file.service';
import { DockerLogService } from './create-image/docker-log.service';
import { ImageBuildService } from './create-image/image-build.service';
import { SourceCodeEventHandlerService } from './create-image/source-code-event-handler.service';
import { DockerPushService } from './create-image/docker-push.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';

@Module({
  providers: [
    ImageBuildGateway,
    FileService,
    DockerLogService,
    ImageBuildService,
    SourceCodeEventHandlerService,
    ImageBuildGateway,
    DockerPushService,
    ],
  imports: [AlsModule,InterfacesModule],
})
export class ContainerSetupModule {}

