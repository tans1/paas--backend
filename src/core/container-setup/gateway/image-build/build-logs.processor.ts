// src/processors/build-logs.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImageBuildGateway } from './Image-build-gateway';

@Processor('build-logs')
export class BuildLogsProcessor extends WorkerHost {
  constructor(private readonly gateway: ImageBuildGateway) {
    super();
  }

  async process(
    job: Job<{
      repositoryId: number;
      branch: string;
      logType: string;
      logMessage: string;
      complete: boolean;
    }>,
  ) {
    const { repositoryId, branch, logType, logMessage, complete } = job.data;
    const key = this.gateway.getKey(repositoryId, branch, logType);
    const subscriber = this.gateway.buildSubscribers.get(key);
    if (subscriber) {
      subscriber.emit(complete ? 'buildComplete' : `${logType}Log`, logMessage);
    }
  }
}
