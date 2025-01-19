import { Module } from '@nestjs/common';
import { CreateImageService } from './create-image/create-image.service';

@Module({
  providers: [CreateImageService],
})
export class ContainerSetupModule {}

// Before we set up the container
// Identify the frame work
// Based on the framework, we need to envoke the specific framework setup method
// based on the result from the above step we create the docker file and store it in the project root directory
// what should we call the service name
