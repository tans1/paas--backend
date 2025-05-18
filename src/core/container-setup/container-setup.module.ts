import { Module } from '@nestjs/common';
// import { CreateImageService } from './create-image/create-image.service';
import { ImageBuildGateway } from './gateway/Image-build-gateway';
import { AlsModule } from '@/utils/als/als.module';
import { FileService } from './create-image/file.service';
import { DockerLogService } from './create-image/docker-log.service';
import { ImageBuildService } from './create-image/image-build.service';
import { SourceCodeEventHandlerService } from './create-image/source-code-event-handler.service';
import { DockerPushService } from './create-image/docker-push.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';
import { RuntimeLogService } from './create-image/containter-runtime-log.service';
import { DeploymentUtilsService } from './deployment-utils/deployment-utils.service';
import { ManageContainerService } from './manage-containers/manage-containers.service';
import { DeploymentEventsGateway } from './gateway/deployment-events.gateway';
import { DockerHubService } from './create-image/docker-hub.service';

@Module({
  providers: [
    ImageBuildGateway,
    DeploymentEventsGateway,
    FileService,
    DockerLogService,
    ImageBuildService,
    SourceCodeEventHandlerService,
    ImageBuildGateway,
    DockerPushService,
    RuntimeLogService,
    DeploymentUtilsService,
    ManageContainerService,
    DockerHubService
  ],
  imports: [AlsModule, InterfacesModule],
  exports: [ManageContainerService, ImageBuildService, DeploymentUtilsService],
})
export class ContainerSetupModule {}
