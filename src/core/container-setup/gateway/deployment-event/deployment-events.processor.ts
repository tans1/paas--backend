// src/processors/deployment-events.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DeploymentEventsGateway } from './deployment-events.gateway';

@Processor('deployment-events')
export class DeploymentEventsProcessor extends WorkerHost {
  constructor(private readonly gateway: DeploymentEventsGateway) {
    super();
  }

  async process(
    job: Job<{ repositoryId: number; branch: string; event: any }>,
  ) {
    const { repositoryId, branch, event } = job.data;
    const key = this.gateway.getKey(repositoryId, branch);
    const client = this.gateway.deployments.get(key);

    switch (job.name) {
      case 'new':
        client?.emit('newDeployment', event);
        break;

      case 'update':
        client?.emit('deploymentUpdate', event);
        break;

      default:
        // optionally handle unknown job names
        break;
    }
  }
}
