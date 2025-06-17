import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FrameworkDetectorModule } from './framework-detector.module';
import { FrameworkDetectionService } from './framework-detection-service/framework-detection.service';
import { FrameworkDispatcherService } from './framework-dispatcher.service';
import { AlsService } from '@/utils/als/als.service';
import { GitHubFileService } from '@/utils/octokit/github-services/github-file.service';

// Mock each imported module as a class so Nest can treat them as valid modules
jest.mock('../events/event.module', () => ({
  EventsModule: class EventsModule {},
  EventNames: {
    PROJECT_UPLOADED: 'PROJECT_UPLOADED',
    FRAMEWORK_DETECTED: 'FRAMEWORK_DETECTED',
    SOURCE_CODE_READY: 'SOURCE_CODE_READY',
  },
}));
jest.mock('@/utils/octokit/octokit.module', () => ({
  OctoktModule: class OctoktModule {},
}));
jest.mock('@/utils/als/als.module', () => ({
  AlsModule: class AlsModule {},
}));

describe('FrameworkDetectorModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        FrameworkDetectorModule,
      ],
    })
      // Provide a dummy AlsService
      .overrideProvider(AlsService)
      .useValue({ getframework: () => 'Docker', getrepositoryId: () => '', getbranchName: () => '' })
      // Provide a dummy GitHubFileService
      .overrideProvider(GitHubFileService)
      .useValue({
        initialize: jest.fn(),
        setRepositoryContext: jest.fn(),
        getConfigFile: jest.fn(),
      })
      .compile();
  });

  it('compiles successfully', () => {
    expect(module).toBeDefined();
  });

  it('provides FrameworkDetectionService', () => {
    const svc = module.get(FrameworkDetectionService);
    expect(svc).toBeInstanceOf(FrameworkDetectionService);
  });

  it('provides FrameworkDispatcherService', () => {
    const svc = module.get(FrameworkDispatcherService);
    expect(svc).toBeInstanceOf(FrameworkDispatcherService);
  });
});
