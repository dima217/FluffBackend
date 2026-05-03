import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export enum WebSocketEvent {
  // Support ticket events
  SUPPORT_TICKET_CREATED = 'support:ticket_created',
  SUPPORT_TICKET_REPLIED = 'support:ticket_replied',
  SUPPORT_TICKET_STATUS_UPDATED = 'support:ticket_status_updated',
}

export interface SupportTicketCreatedPayload {
  ticketId: number;
  userId: number;
  subject: string;
  status: string;
  createdAt: Date;
  timestamp: string;
}

export interface SupportTicketRepliedPayload {
  ticketId: number;
  userId: number;
  response: string;
  status: string;
  updatedAt: Date;
  timestamp: string;
}

export interface SupportTicketStatusUpdatedPayload {
  ticketId: number;
  userId: number;
  status: string;
  updatedAt: Date;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class AppWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  /**
   * Emit support ticket created event (to admins)
   */
  emitSupportTicketCreated(payload: Omit<SupportTicketCreatedPayload, 'timestamp'>): void {
    const fullPayload: SupportTicketCreatedPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    this.server.emit(WebSocketEvent.SUPPORT_TICKET_CREATED, fullPayload);
    this.logger.log(`Support ticket created event emitted: ${payload.ticketId}`);
  }

  /**
   * Emit support ticket replied event (to specific user)
   */
  emitSupportTicketReplied(payload: Omit<SupportTicketRepliedPayload, 'timestamp'>): void {
    const fullPayload: SupportTicketRepliedPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    // Emit to all clients (user will filter on frontend)
    this.server.emit(WebSocketEvent.SUPPORT_TICKET_REPLIED, fullPayload);
    this.logger.log(`Support ticket replied event emitted: ${payload.ticketId}`);
  }

  /**
   * Emit support ticket status updated event (to specific user)
   */
  emitSupportTicketStatusUpdated(
    payload: Omit<SupportTicketStatusUpdatedPayload, 'timestamp'>,
  ): void {
    const fullPayload: SupportTicketStatusUpdatedPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    // Emit to all clients (user will filter on frontend)
    this.server.emit(WebSocketEvent.SUPPORT_TICKET_STATUS_UPDATED, fullPayload);
    this.logger.log(`Support ticket status updated event emitted: ${payload.ticketId}`);
  }
}
