import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DeploymentEventsGateway } from './deployment-events.gateway';

@Processor('deployment-events')
export class DeploymentEventsProcessor extends WorkerHost {
  constructor(private readonly gateway: DeploymentEventsGateway) {
    super();
  }

  async process(
    job: Job<{ repositoryId: number; branch: string; event: any }> & { name: string },
  ) {
    const { repositoryId, branch, event } = job.data;
    const key    = this.gateway.getKey(repositoryId, branch);
    const client = this.gateway.deployments.get(key);

    switch (job.name) {
      case 'new':
        if (client) {
          client.emit('newDeployment', event);
        } else {
          this.gateway.bufferEvent(key, 'new', event);
        }
        break;

      case 'update':
        if (client) {
          client.emit('deploymentUpdate', event);
        } else {
          this.gateway.bufferEvent(key, 'update', event);
        }
        break;

      default:
        // unrecognized job types could also be buffered or logged here
        break;
    }
  }
}
