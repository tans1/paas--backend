import { Test, TestingModule } from '@nestjs/testing';
import { CoreModule } from './core.module';
import { FrameWorksModule } from './frame-works/frame-works.module';
import { BuildToolsModule } from './build-tools/build-tools.module';
import { RunToolsModule } from './run-tools/run-tools.module';
import { FrameworkDetectorModule } from './framework-detector/framework-detector.module';
import { ContainerSetupModule } from './container-setup/container-setup.module';
import { CliModule } from './cli/cli.module';
import { FileSystemModule } from './file-system/file-system.module';
import { ClientModule } from './client/client.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('CoreModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CoreModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import all required modules', () => {
    const coreModule = module.get(CoreModule);
    expect(coreModule).toBeDefined();
    
    // Verify all required modules are imported
    expect(module.get(FrameWorksModule)).toBeDefined();
    expect(module.get(BuildToolsModule)).toBeDefined();
    expect(module.get(RunToolsModule)).toBeDefined();
    expect(module.get(FrameworkDetectorModule)).toBeDefined();
    expect(module.get(ContainerSetupModule)).toBeDefined();
    expect(module.get(CliModule)).toBeDefined();
    expect(module.get(FileSystemModule)).toBeDefined();
    expect(module.get(ClientModule)).toBeDefined();
    expect(module.get(EventEmitterModule)).toBeDefined();
  });
}); 