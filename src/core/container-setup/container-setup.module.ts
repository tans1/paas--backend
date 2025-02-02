import { Module } from '@nestjs/common';
import { CreateImageService } from './create-image/create-image.service';

@Module({
  providers: [CreateImageService],
})
export class ContainerSetupModule {}

