import { Module } from '@nestjs/common';
import { FrameWorksModule } from './frame-works/frame-works.module';
import { BuildToolsModule } from './build-tools/build-tools.module';
import { RunToolsModule } from './run-tools/run-tools.module';
import { FrameworkDetectorModule } from './framework-detector/framework-detector.module';
import { ContainerSetupModule } from './container-setup/container-setup.module';
import { CliModule } from './cli/cli.module';
import { FileSystemModule } from './file-system/file-system.module';
import { ClientModule } from './client/client.module';
@Module({
    imports: [FrameWorksModule, BuildToolsModule, RunToolsModule, FrameworkDetectorModule, ContainerSetupModule, CliModule, FileSystemModule, ClientModule],
})
export class CoreModule {}
