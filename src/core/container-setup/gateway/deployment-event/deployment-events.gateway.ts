// src/gateways/deployment-events.gateway.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NewDeployment, DeploymentUpdate } from '../dto/deployment.event.dto';

@WebSocketGateway({
  namespace: '/deployments',
  cors: true,
})
export class DeploymentEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  public deployments = new Map<string, Socket>();

  constructor(
    @InjectQueue('deployment-events') public readonly deployQueue: Queue,
  ) {}

  handleConnection(client: Socket) {
    const repositoryId = client.handshake.query.repositoryId;
    const branch = client.handshake.query.branch as string;

    if (repositoryId && branch) {
      const key = this.getKey(Number(repositoryId), branch);
      this.deployments.set(key, client);
      console.log(`Deployment listener connected -> ${key}`);
    }
  }

  handleDisconnect(client: Socket) {
    const key = Array.from(this.deployments.entries()).find(
      ([, socket]) => socket.id === client.id,
    )?.[0];
    if (key) {
      this.deployments.delete(key);
      console.log(`Deployment listener disconnected: ${key}`);
    }
  }

  async sendNewDeploymentEvent(
    repositoryId: number,
    branch: string,
    event: NewDeployment,
  ) {
    await this.deployQueue.add('new', { repositoryId, branch, event });
  } 

  async sendDeploymentUpdateEvent(
    repositoryId: number,
    branch: string,
    event: DeploymentUpdate,
  ) {
    await this.deployQueue.add('update', { repositoryId, branch, event });
  }

  getKey(repositoryId: number, branch: string) {
    return `${repositoryId}:${branch}`;
  }
}
