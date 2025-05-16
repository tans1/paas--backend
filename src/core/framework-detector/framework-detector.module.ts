import { Module } from '@nestjs/common';
import { FrameworkDetectionService } from './framework-detection-service/framework-detection.service';
import { EventsModule } from '../events/event.module';
import { RepositoriesModule } from '@/infrastructure/database/repositories/repositories.module';
import { OctoktModule } from '@/utils/octokit/octokit.module';
import { AlsModule } from '@/utils/als/als.module';
import { FrameworkDispatcherService } from './framework-dispatcher.service';

@Module({
  imports: [EventsModule, OctoktModule, AlsModule],
  providers: [FrameworkDetectionService, FrameworkDispatcherService],
  exports: [FrameworkDetectionService],
})
export class FrameworkDetectorModule {}
