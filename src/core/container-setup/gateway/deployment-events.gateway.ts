// deployment-events.gateway.ts
import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NewDeployment, DeploymentUpdate } from './dto/deployment.event.dto';

@WebSocketGateway({ 
  namespace: '/deployments',  // Add namespace for separation
  cors: true 
})
export class DeploymentEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private deployments = new Map<string, Socket>();

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

  sendNewDeploymentEvent(repositoryId: number, branch: string, event: NewDeployment) {
    const key = this.getKey(repositoryId, branch);
    const socket = this.deployments.get(key);
    socket?.emit('newDeployment', event);
  }

  sendDeploymentUpdateEvent(repositoryId: number, branch: string, event: DeploymentUpdate) {
    const key = this.getKey(repositoryId, branch);
    const socket = this.deployments.get(key);
    socket?.emit('deploymentUpdate', event);
  }

  private getKey(repositoryId: number, branch: string) {
    return `${repositoryId}:${branch}`;
  }
}