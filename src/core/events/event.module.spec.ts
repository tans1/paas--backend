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
    it('should define all project lifecycle events', () => {
      expect(EventNames.PROJECT_UPLOADED).toBe('project.uploaded');
      expect(EventNames.PROJECT_INITIALIZED).toBe('project.initialized');
      expect(EventNames.PushEventReceived).toBe('push.event.received');
      expect(EventNames.SourceCodeReady).toBe('source.code.ready');
    });

    it('should define all framework detection events', () => {
      expect(EventNames.FRAMEWORK_DETECTED).toBe('framework.detected');
      expect(EventNames.FRAMEWORK_INFORMATION_RETRIEVED).toBe('framework.information.retrieved');
    });

    it('should define all environment variable events', () => {
      expect(EventNames.ENVIRONMENT_VARIABLES_UPDATED).toBe('environment.variables.updated');
    });

    it('should define all dockerfile generation events', () => {
      expect(EventNames.DOCKERFILE_GENERATION_STARTED).toBe('dockerfile.generation.started');
      expect(EventNames.DOCKERFILE_GENERATION_COMPLETED).toBe('dockerfile.generation.completed');
      expect(EventNames.DOCKERFILE_GENERATION_FAILED).toBe('dockerfile.generation.failed');
    });

    it('should define all docker image build events', () => {
      expect(EventNames.DOCKER_IMAGE_BUILD_STARTED).toBe('docker.image.build.started');
      expect(EventNames.DOCKER_IMAGE_BUILD_COMPLETED).toBe('docker.image.build.completed');
      expect(EventNames.DOCKER_IMAGE_BUILD_FAILED).toBe('docker.image.build.failed');
      expect(EventNames.DOCKER_IMAGE_PUSH_STARTED).toBe('docker.image.push.started');
      expect(EventNames.DOCKER_IMAGE_PUSH_COMPLETED).toBe('docker.image.push.completed');
      expect(EventNames.DOCKER_IMAGE_PUSH_FAILED).toBe('docker.image.push.failed');
    });

    it('should define all deployment events', () => {
      expect(EventNames.CONTAINER_SETUP_STARTED).toBe('container.setup.started');
      expect(EventNames.CONTAINER_SETUP_COMPLETED).toBe('container.setup.completed');
      expect(EventNames.CONTAINER_VERIFIED).toBe('container.verified');
    });

    it('should define all feedback events', () => {
      expect(EventNames.SUCCESS_FEEDBACK_SENT).toBe('feedback.success.sent');
      expect(EventNames.FAILURE_FEEDBACK_SENT).toBe('failure.feedback.sent');
    });

    it('should define project rollback event', () => {
      expect(EventNames.PROJECT_ROLLBACK).toBe('project.rollback');
    });
  });
});