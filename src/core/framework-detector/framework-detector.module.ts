import { Module } from '@nestjs/common';
import { FrameworkDetectionService } from './framework-detection-service/framework-detection.service';

@Module({
  providers: [FrameworkDetectionService],
})
export class FrameworkDetectorModule {}
