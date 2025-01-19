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

  // Framework detection events
  FRAMEWORK_DETECTED: 'framework.detected',
  FRAMEWORK_INFORMATION_RETRIEVED: 'framework.information.retrieved',

  // Dockerfile generation events
  DOCKERFILE_GENERATION_STARTED: 'dockerfile.generation.started',
  DOCKERFILE_GENERATED: 'dockerfile.generated',

  // Docker image build events
  IMAGE_BUILD_STARTED: 'image.build.started',
  IMAGE_BUILT: 'image.built',

  // Deployment events
  CONTAINER_SETUP_STARTED: 'container.setup.started',
  CONTAINER_SETUP_COMPLETED: 'container.setup.completed',
  CONTAINER_VERIFIED: 'container.verified',

  // Feedback events
  SUCCESS_FEEDBACK_SENT: 'feedback.success.sent',
  FAILURE_FEEDBACK_SENT: 'feedback.failure.sent',
};
