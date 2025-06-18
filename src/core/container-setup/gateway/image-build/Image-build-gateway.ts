// src/gateways/image-build.gateway.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/build-logs',
  cors: true,
})
export class ImageBuildGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  public buildSubscribers = new Map<string, Socket>();

  constructor(
    @InjectQueue('build-logs') public readonly buildLogQueue: Queue,
  ) {}

  handleConnection(client: Socket) {
    const repositoryId = client.handshake.query.repositoryId;
    const branch = client.handshake.query.branch as string;
    const logType = client.handshake.query.type as string;

    if (repositoryId && branch && logType) {
      const key = this.getKey(Number(repositoryId), branch, logType);
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

  async sendLogToUser(
    repositoryId: number,
    branch: string,
    logType: string,
    logMessage: string,
    complete = false,
  ) {
    await this.buildLogQueue.add('log-line', {
      repositoryId,
      branch,
      logType,
      logMessage,
      complete,
    });
  }

  getKey(repositoryId: number, branch: string, logType: string) {
    return `${repositoryId}:${branch}:${logType}`;
  }
}
