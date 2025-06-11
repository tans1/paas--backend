import { Module } from '@nestjs/common';
import { FrameWorksModule } from './frame-works/frame-works.module';
import { BuildToolsModule } from './build-tools/build-tools.module';
import { RunToolsModule } from './run-tools/run-tools.module';
import { FrameworkDetectorModule } from './framework-detector/framework-detector.module';
import { ContainerSetupModule } from './container-setup/container-setup.module';
import { CliModule } from './cli/cli.module';
import { FileSystemModule } from './file-system/file-system.module';
import { ClientModule } from './client/client.module';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
// import { EventsModule } from './events/event.module';
import { UsageMetricsModule } from './usage-metrics/usage-metrics.module';
@Module({
  imports: [
    FrameWorksModule,
    BuildToolsModule,
    RunToolsModule,
    FrameworkDetectorModule,
    ContainerSetupModule,
    CliModule,
    FileSystemModule,
    ClientModule,
    EventEmitterModule.forRoot(),
    UsageMetricsModule,
  ],
  exports: [],
})
export class CoreModule {}
