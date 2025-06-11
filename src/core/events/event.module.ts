// src/core/events/events.module.ts
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class EventsModule {}

export const EventNames = {
  // Project upload and initialization events
  PROJECT_UPLOADED: 'project.uploaded',
  PROJECT_INITIALIZED: 'project.initialized',

  // PushEventReceived
  PushEventReceived: 'push.event.received',

  // Source code events
  SourceCodeReady: 'source.code.ready',

  // Framework detection events
  FRAMEWORK_DETECTED: 'framework.detected',
  FRAMEWORK_INFORMATION_RETRIEVED: 'framework.information.retrieved',


  // Environment variable events
  ENVIRONMENT_VARIABLES_UPDATED: 'environment.variables.updated',
  // Dockerfile generation events
  DOCKERFILE_GENERATION_STARTED: 'dockerfile.generation.started',
  DOCKERFILE_GENERATION_COMPLETED: 'dockerfile.generation.completed',
  DOCKERFILE_GENERATION_FAILED: 'dockerfile.generation.failed',

  // Docker image build events
  DOCKER_IMAGE_BUILD_STARTED: 'docker.image.build.started',
  DOCKER_IMAGE_BUILD_COMPLETED: 'docker.image.build.completed',
  DOCKER_IMAGE_BUILD_FAILED: 'docker.image.build.failed',
  DOCKER_IMAGE_PUSH_STARTED: 'docker.image.push.started',
  DOCKER_IMAGE_PUSH_COMPLETED: 'docker.image.push.completed',
  DOCKER_IMAGE_PUSH_FAILED: 'docker.image.push.failed',

  // Deployment events
  CONTAINER_SETUP_STARTED: 'container.setup.started',
  CONTAINER_SETUP_COMPLETED: 'container.setup.completed',
  CONTAINER_VERIFIED: 'container.verified',

  // Feedback events
  SUCCESS_FEEDBACK_SENT: 'feedback.success.sent',
  FAILURE_FEEDBACK_SENT: 'failure.feedback.sent',

  // Project rollback event
  PROJECT_ROLLBACK: 'project.rollback',
} as const;
