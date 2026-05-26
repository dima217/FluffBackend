import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupportService } from '@application/service/support.service';
import type { SupportMessageAttachment } from '@domain/entities/support-message.entity';
import type { AppConfig } from '@config';

// ─── Event names ─────────────────────────────────────────────────────────────

export enum WebSocketEvent {
  // Broadcast events (ticket lifecycle)
  SUPPORT_TICKET_CREATED = 'support:ticket_created',
  SUPPORT_TICKET_REPLIED = 'support:ticket_replied',
  SUPPORT_TICKET_STATUS_UPDATED = 'support:ticket_status_updated',

  // Chat events (server → client, per room)
  SUPPORT_MESSAGE = 'support.message',
  SUPPORT_TYPING = 'support.typing',
  SUPPORT_READ = 'support.read',
  SUPPORT_SEND_ACK = 'support.send.ack',
  SUPPORT_EDIT = 'support.edit',
  SUPPORT_ERROR = 'support.error',
}

// ─── Payload interfaces ───────────────────────────────────────────────────────

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
  subject: string;
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

// ─── Internal socket metadata ─────────────────────────────────────────────────

interface SocketMeta {
  userId: number;
  isAdmin: boolean;
}

// ─── Gateway ──────────────────────────────────────────────────────────────────

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class AppWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);
  private readonly socketMeta = new Map<string, SocketMeta>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
    @Inject(forwardRef(() => SupportService))
    private readonly supportService: SupportService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      // Unauthenticated connections are allowed; chat events will reject if no meta
      this.logger.debug(`Client ${client.id} connected without token`);
      return;
    }

    try {
      const appConfig = this.configService.get<AppConfig>('app', { infer: true });
      const payload = this.jwtService.verify<{ sub: number; isSuper?: boolean }>(token, {
        secret: appConfig?.jwt.secret,
      });
      this.socketMeta.set(client.id, {
        userId: payload.sub,
        isAdmin: payload.isSuper ?? false,
      });
      this.logger.log(`Client ${client.id} authenticated as user ${payload.sub}`);
    } catch (e) {
      this.logger.warn(`Client ${client.id} sent invalid token: ${e instanceof Error ? e.message : 'Unknown error'}`);
      client.emit(WebSocketEvent.SUPPORT_ERROR, { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.socketMeta.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake?.auth?.token as string | undefined;
    const query = client.handshake?.query?.token;
    const raw = auth ?? (Array.isArray(query) ? query[0] : (query as string | undefined));
    return raw ? this.normalizeBearerToken(raw) : undefined;
  }

  private normalizeBearerToken(token: string): string {
    return token.startsWith('Bearer ') ? token.slice(7) : token;
  }

  private getMeta(client: Socket): SocketMeta {
    const meta = this.socketMeta.get(client.id);
    if (!meta) throw new Error('Unauthorized');
    return meta;
  }

  private room(ticketId: number) {
    return `ticket:${ticketId}`;
  }

  private emitError(client: Socket, message: string) {
    client.emit(WebSocketEvent.SUPPORT_ERROR, { message });
  }

  // ─── Chat events (client → server) ───────────────────────────────────────────

  /**
   * support.join { ticket_id }
   * User: can only join their own ticket room.
   * Admin: can join any ticket room.
   * After joining, admin marks ticket as seen.
   */
  @SubscribeMessage('support.join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticket_id: number },
  ) {
    try {
      const meta = this.getMeta(client);

      if (!meta.isAdmin) {
        // Validates ownership — throws 404/403 if ticket doesn't belong to user
        await this.supportService.findOneByUser(payload.ticket_id, meta.userId);
      }

      client.join(this.room(payload.ticket_id));
      this.logger.debug(`User ${meta.userId} joined ${this.room(payload.ticket_id)}`);

      if (meta.isAdmin) {
        await this.supportService.markAdminSeen(payload.ticket_id);
      }
    } catch (e) {
      this.emitError(client, e instanceof Error ? e.message : 'Failed to join');
    }
  }

  /**
   * support.leave { ticket_id }
   */
  @SubscribeMessage('support.leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticket_id: number },
  ) {
    client.leave(this.room(payload.ticket_id));
  }

  /**
   * support.send { ticket_id, content, client_request_id?, attachments? }
   * Persists message, broadcasts to room, sends ack to sender.
   */
  @SubscribeMessage('support.send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      ticket_id: number;
      content?: string;
      client_request_id?: string;
      attachments?: SupportMessageAttachment[];
    },
  ) {
    try {
      const meta = this.getMeta(client);

      const message = await this.supportService.sendMessage(
        payload.ticket_id,
        meta.userId,
        meta.isAdmin ? 'admin' : 'user',
        payload.content ?? '',
        payload.attachments ?? [],
      );

      this.server.to(this.room(payload.ticket_id)).emit(WebSocketEvent.SUPPORT_MESSAGE, message);

      if (payload.client_request_id) {
        client.emit(WebSocketEvent.SUPPORT_SEND_ACK, {
          client_request_id: payload.client_request_id,
          message_id: message.id,
          created_at: message.createdAt,
        });
      }
    } catch (e) {
      this.emitError(client, e instanceof Error ? e.message : 'Failed to send');
    }
  }

  /**
   * support.edit { ticket_id, message_id, content }
   * Only message author (or admin) can edit.
   */
  @SubscribeMessage('support.edit')
  async handleEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticket_id: number; message_id: number; content: string },
  ) {
    try {
      const meta = this.getMeta(client);

      const updated = await this.supportService.editMessage(
        payload.message_id,
        meta.userId,
        meta.isAdmin,
        payload.content,
      );

      this.server.to(this.room(payload.ticket_id)).emit(WebSocketEvent.SUPPORT_EDIT, {
        ticket_id: payload.ticket_id,
        message_id: updated.id,
        content: updated.content,
        edited_at: updated.editedAt,
      });
    } catch (e) {
      this.emitError(client, e instanceof Error ? e.message : 'Failed to edit');
    }
  }

  /**
   * support.typing { ticket_id, is_typing }
   * Broadcasts typing indicator to the room (excluding sender).
   */
  @SubscribeMessage('support.typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticket_id: number; is_typing: boolean },
  ) {
    try {
      const meta = this.getMeta(client);
      client.to(this.room(payload.ticket_id)).emit(WebSocketEvent.SUPPORT_TYPING, {
        ticket_id: payload.ticket_id,
        user_id: meta.userId,
        is_admin: meta.isAdmin,
        is_typing: payload.is_typing,
      });
    } catch (e) {
      this.emitError(client, e instanceof Error ? e.message : 'Unauthorized');
    }
  }

  /**
   * support.read { ticket_id }
   * User marks admin messages as read; admin marks ticket as seen.
   * Broadcasts read receipt to the room.
   */
  @SubscribeMessage('support.read')
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticket_id: number },
  ) {
    try {
      const meta = this.getMeta(client);

      if (meta.isAdmin) {
        await this.supportService.markAdminSeen(payload.ticket_id);
      } else {
        await this.supportService.markUserRead(payload.ticket_id);
      }

      this.server.to(this.room(payload.ticket_id)).emit(WebSocketEvent.SUPPORT_READ, {
        ticket_id: payload.ticket_id,
        user_id: meta.userId,
        is_admin: meta.isAdmin,
        read_at: new Date(),
      });
    } catch (e) {
      this.emitError(client, e instanceof Error ? e.message : 'Failed to mark read');
    }
  }

  // ─── Server-emitted broadcast methods (called from SupportService) ───────────

  emitSupportTicketCreated(payload: Omit<SupportTicketCreatedPayload, 'timestamp'>): void {
    const full: SupportTicketCreatedPayload = { ...payload, timestamp: new Date().toISOString() };
    this.server.emit(WebSocketEvent.SUPPORT_TICKET_CREATED, full);
    this.logger.log(`Emitted support:ticket_created for ticket ${payload.ticketId}`);
  }

  emitSupportTicketReplied(payload: Omit<SupportTicketRepliedPayload, 'timestamp'>): void {
    const full: SupportTicketRepliedPayload = { ...payload, timestamp: new Date().toISOString() };
    this.server.emit(WebSocketEvent.SUPPORT_TICKET_REPLIED, full);
    this.logger.log(`Emitted support:ticket_replied for ticket ${payload.ticketId}`);
  }

  emitSupportTicketStatusUpdated(
    payload: Omit<SupportTicketStatusUpdatedPayload, 'timestamp'>,
  ): void {
    const full: SupportTicketStatusUpdatedPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    this.server.emit(WebSocketEvent.SUPPORT_TICKET_STATUS_UPDATED, full);
    this.logger.log(`Emitted support:ticket_status_updated for ticket ${payload.ticketId}`);
  }

  /** Push a persisted message into a ticket room (e.g. sent via REST). */
  emitMessageToTicket(ticketId: number, message: unknown): void {
    this.server.to(this.room(ticketId)).emit(WebSocketEvent.SUPPORT_MESSAGE, message);
  }
}
