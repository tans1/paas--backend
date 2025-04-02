import { Module } from '@nestjs/common';
import { FrameworkDetectionService } from './framework-detection-service/framework-detection.service';
import { EventsModule } from '../events/event.module';

@Module({
  imports: [EventsModule],
  providers: [FrameworkDetectionService],
})
export class FrameworkDetectorModule {}
