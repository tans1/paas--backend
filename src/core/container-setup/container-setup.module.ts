import { Module } from '@nestjs/common';
import { CreateImageService } from './create-image/create-image.service';
import { ImageBuildGateway } from './Image-build-gateway';
import { AlsModule } from '@/utils/als/als.module';

@Module({
  providers: [CreateImageService,ImageBuildGateway],
  imports: [AlsModule],
})
export class ContainerSetupModule {}

