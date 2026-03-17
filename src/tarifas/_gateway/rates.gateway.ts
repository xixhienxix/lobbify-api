import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({})
export class RatesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('Rates WebSocket initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected to Rates: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected from Rates: ${client.id}`);
  }

  // 🔥 Call this when rates are created, updated or deleted
  broadcastRatesUpdate() {
    this.server.emit('rates-updated');
  }
}
