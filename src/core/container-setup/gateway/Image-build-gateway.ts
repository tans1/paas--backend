import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/build-logs',  // Added namespace for build logs
  cors: true
})
export class ImageBuildGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private buildSubscribers = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const repositoryId = client.handshake.query.repositoryId;
    const branch = client.handshake.query.branch as string;
    const logType = client.handshake.query.type as string;

    if (repositoryId && branch && logType) {
      const key = this.getKey(
        Number(repositoryId),
        branch,
        logType
      );
      this.buildSubscribers.set(key, client);
      console.log(`Build subscriber connected: ${key}`);
    }
  }

  handleDisconnect(client: Socket) {
    const key = Array.from(this.buildSubscribers.entries()).find(
      ([, socket]) => socket.id === client.id,
    )?.[0];
    
    if (key) {
      this.buildSubscribers.delete(key);
      console.log(`Build subscriber disconnected: ${key}`);
    }
  }

  sendLogToUser(
    repositoryId: number,
    branch: string,
    logType: string,
    logMessage: string,
    complete = false
  ) {
    const key = this.getKey(repositoryId, branch, logType);
    const subscriber = this.buildSubscribers.get(key);

    if (subscriber) {
      let eventName = complete ? 'buildComplete' : `${logType}Log`;
      subscriber.emit(eventName, logMessage);
    }
  }

  private getKey(repositoryId: number, branch: string, logType: string) {
    return `${repositoryId}:${branch}:${logType}`;
  }
}