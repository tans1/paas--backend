import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ cors: true })
export class ImageBuildGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private users = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const repositoryId = client.handshake.query.repositoryId as string;
    if (repositoryId) {
      this.users.set(repositoryId, client);
      console.log(`User with repository Id - ${repositoryId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    const repositoryId = Array.from(this.users.entries()).find(([, socket]) => socket.id === client.id)?.[0];
    if (repositoryId) {
      this.users.delete(repositoryId);
      console.log(`User with repository - ${repositoryId} disconnected`);
    }
  }

  sendLogToUser(repositoryId: string, logMessage: string) {
    const userSocket = this.users.get(repositoryId.toString());
    if (userSocket) {
      userSocket.emit("deploymentLog", logMessage);
    }
  }
}
