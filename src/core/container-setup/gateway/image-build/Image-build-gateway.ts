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
type LogEntry = {message: string, complete: boolean};
@WebSocketGateway({
  namespace: '/build-logs',
  cors: true,
})
export class ImageBuildGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  public buildSubscribers = new Map<string, Socket>();
 
  public logBuffers = new Map<string, LogEntry[]>();

  constructor(
    @InjectQueue('build-logs') public readonly buildLogQueue: Queue,
  ) {}

  async handleConnection(client: Socket) {
    // grab query params from the socket handshake
    const repositoryIdRaw = client.handshake.query.repositoryId;
    const branch          = client.handshake.query.branch as string;
    const logType         = client.handshake.query.type   as string;
  
    // ensure all required params exist
    if (!repositoryIdRaw || !branch || !logType) {
      return;
    }
  
    const repositoryId = Number(repositoryIdRaw);
    const key          = this.getKey(repositoryId, branch, logType);
  
    // register the socket subscriber
    this.buildSubscribers.set(key, client);
    console.log(`Build subscriber connected: ${key}`);
  
    // re-enqueue any buffered logs, in order
    const buf = this.logBuffers.get(key);
    if (buf && buf.length) {
      for (const entry of buf) {
        await this.buildLogQueue.add('log-line', {
          repositoryId,
          branch,
          logType,
          logMessage: entry.message,   // from your LogEntry type
          complete:   entry.complete,  // from your LogEntry type
        });
      }
      // remove buffer so we don't re-send
      this.logBuffers.delete(key);
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
