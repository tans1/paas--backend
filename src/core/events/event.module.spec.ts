import { Test, TestingModule } from '@nestjs/testing';
import { EventsModule, EventNames } from './event.module';

describe('EventsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EventsModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  describe('EventNames', () => {
    it('should have all required event names defined', () => {
      expect(EventNames).toBeDefined();
      expect(EventNames).toHaveProperty('PROJECT_UPLOADED');
      expect(EventNames).toHaveProperty('PROJECT_INITIALIZED');
      expect(EventNames).toHaveProperty('PushEventReceived');
      expect(EventNames).toHaveProperty('SourceCodeReady');
      expect(EventNames).toHaveProperty('FRAMEWORK_DETECTED');
      expect(EventNames).toHaveProperty('FRAMEWORK_INFORMATION_RETRIEVED');
      expect(EventNames).toHaveProperty('DOCKERFILE_GENERATION_STARTED');
      expect(EventNames).toHaveProperty('DOCKERFILE_GENERATED');
      expect(EventNames).toHaveProperty('IMAGE_BUILD_STARTED');
      expect(EventNames).toHaveProperty('IMAGE_BUILT');
      expect(EventNames).toHaveProperty('CONTAINER_SETUP_STARTED');
      expect(EventNames).toHaveProperty('CONTAINER_SETUP_COMPLETED');
      expect(EventNames).toHaveProperty('CONTAINER_VERIFIED');
      expect(EventNames).toHaveProperty('SUCCESS_FEEDBACK_SENT');
      expect(EventNames).toHaveProperty('FAILURE_FEEDBACK_SENT');
    });

    it('should have correct event name values', () => {
      expect(EventNames.PROJECT_UPLOADED).toBe('project.uploaded');
      expect(EventNames.PROJECT_INITIALIZED).toBe('project.initialized');
      expect(EventNames.PushEventReceived).toBe('push.event.received');
      expect(EventNames.SourceCodeReady).toBe('source.code.ready');
      expect(EventNames.FRAMEWORK_DETECTED).toBe('framework.detected');
      expect(EventNames.FRAMEWORK_INFORMATION_RETRIEVED).toBe('framework.information.retrieved');
      expect(EventNames.DOCKERFILE_GENERATION_STARTED).toBe('dockerfile.generation.started');
      expect(EventNames.DOCKERFILE_GENERATED).toBe('dockerfile.generated');
      expect(EventNames.IMAGE_BUILD_STARTED).toBe('image.build.started');
      expect(EventNames.IMAGE_BUILT).toBe('image.built');
      expect(EventNames.CONTAINER_SETUP_STARTED).toBe('container.setup.started');
      expect(EventNames.CONTAINER_SETUP_COMPLETED).toBe('container.setup.completed');
      expect(EventNames.CONTAINER_VERIFIED).toBe('container.verified');
      expect(EventNames.SUCCESS_FEEDBACK_SENT).toBe('feedback.success.sent');
      expect(EventNames.FAILURE_FEEDBACK_SENT).toBe('feedback.failure.sent');
    });
  });
}); 