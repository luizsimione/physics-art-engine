import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, ValidationPipe, UsePipes } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StartStreamDto } from './dto/start-stream.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately for production
  },
})
export class StreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StreamGateway.name);

  constructor(private readonly streamService: StreamService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.streamService.stopStream(client.id);
  }

  @SubscribeMessage('start-stream')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleStartStream(
    @MessageBody() data: StartStreamDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.logger.log(`Starting stream for client ${client.id}: ${JSON.stringify(data)}`);

    try {
      await this.streamService.startStream(client.id, data, (frame) => {
        client.emit('frame', frame);
      });

      client.emit('stream-started', {
        message: 'Simulation stream started',
        params: data,
      });
    } catch (error) {
      this.logger.error(`Stream error for client ${client.id}: ${error.message}`);
      client.emit('stream-error', {
        message: error.message,
      });
    }
  }

  @SubscribeMessage('stop-stream')
  handleStopStream(@ConnectedSocket() client: Socket): void {
    this.logger.log(`Stopping stream for client ${client.id}`);
    this.streamService.stopStream(client.id);
    client.emit('stream-stopped', {
      message: 'Simulation stream stopped',
    });
  }
}
