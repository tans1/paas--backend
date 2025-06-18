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

interface BufferedEvent {
  type: 'new' | 'update';
  payload: NewDeployment | DeploymentUpdate;
}

@WebSocketGateway({
  namespace: '/deployments',
  cors: true,
})
export class DeploymentEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  public deployments   = new Map<string, Socket>();
  private eventBuffers = new Map<string, BufferedEvent[]>();

  constructor(
    @InjectQueue('deployment-events') public readonly deployQueue: Queue,
  ) {}

  handleConnection(client: Socket) {
    const repositoryIdRaw = client.handshake.query.repositoryId;
    const branch          = client.handshake.query.branch as string;
    if (!repositoryIdRaw || !branch) return;

    const repositoryId = Number(repositoryIdRaw);
    const key          = this.getKey(repositoryId, branch);
    this.deployments.set(key, client);
    console.log(`Deployment listener connected -> ${key}`);

    // flush any buffered events
    const buf = this.eventBuffers.get(key);
    if (buf && buf.length) {
      for (const entry of buf) {
        const eventName = entry.type === 'new' ? 'newDeployment' : 'deploymentUpdate';
        client.emit(eventName, entry.payload);
      }
      this.eventBuffers.delete(key);
    }
  }

  handleDisconnect(client: Socket) {
    const found = Array.from(this.deployments.entries()).find(
      ([, socket]) => socket.id === client.id,
    );
    if (found) {
      this.deployments.delete(found[0]);
      console.log(`Deployment listener disconnected: ${found[0]}`);
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

  /** Called by the processor when no client is connected */
  bufferEvent(key: string, type: 'new' | 'update', payload: any) {
    const buf = this.eventBuffers.get(key) ?? [];
    buf.push({ type, payload });
    this.eventBuffers.set(key, buf);
  }

  getKey(repositoryId: number, branch: string) {
    return `${repositoryId}:${branch}`;
  }
}
