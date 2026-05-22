import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupportTicket, SupportTicketStatus } from '@domain/entities/support-ticket.entity';
import type { MessageSenderType, SupportMessageAttachment } from '@domain/entities/support-message.entity';
import {
  CreateSupportTicketDto,
  ReplyToTicketDto,
  UpdateTicketStatusDto,
  SupportTicketQueryDto,
  SupportTicketSortBy,
  SupportTicketSortOrder,
  SupportTicketResponseDto,
  SupportMessageResponseDto,
  GetMessagesQueryDto,
} from '@application/dto/support.dto';
import { AppWebSocketGateway } from '@application/gateway/support.gatewat';
import type { ISupportRepository } from '@domain/interface/support.repository';
import type { ISupportMessageRepository } from '@domain/interface/support-message.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { MediaService } from './media.service';
import { ISupportService } from '@application/interface/service/support.service';
import { CreateMediaResponseDto } from '@application/interface/service/media.service';

export interface SupportTicketsResponse {
  tickets: SupportTicketResponseDto[];
  total: number;
  limit: number;
  offset: number;
}

export function sortTickets(
  tickets: SupportTicket[],
  sortBy: SupportTicketSortBy,
  sortOrder: SupportTicketSortOrder,
) {
  const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
  switch (sortBy) {
    case SupportTicketSortBy.UPDATED_AT:
      tickets.sort((a, b) =>
        orderDirection === 'ASC'
          ? a.updatedAt.getTime() - b.updatedAt.getTime()
          : b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
      break;
    case SupportTicketSortBy.STATUS:
      tickets.sort((a, b) =>
        orderDirection === 'ASC'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status),
      );
      break;
    case SupportTicketSortBy.CREATED_AT:
    default:
      tickets.sort((a, b) =>
        orderDirection === 'ASC'
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime(),
      );
      break;
  }
  return tickets;
}

@Injectable()
export class SupportService implements ISupportService {
  constructor(
    @Inject(REPOSITORY_CONSTANTS.SUPPORT_TICKET_REPOSITORY)
    private readonly supportTicketRepository: ISupportRepository,
    @Inject(REPOSITORY_CONSTANTS.SUPPORT_MESSAGE_REPOSITORY)
    private readonly supportMessageRepository: ISupportMessageRepository,
    @Inject(forwardRef(() => AppWebSocketGateway))
    private webSocketGateway: AppWebSocketGateway,
    private readonly mediaService: MediaService,
  ) {}

  // ─── Tickets ─────────────────────────────────────────────────────────────────

  async create(
    userId: number,
    createDto: CreateSupportTicketDto,
    token: string,
  ): Promise<{ ticket: SupportTicketResponseDto; media: CreateMediaResponseDto | null }> {
    let supportMedia: CreateMediaResponseDto | null = null;

    if (createDto.screenshot) {
      supportMedia = await this.mediaService.createMedia(
        {
          filename: createDto.screenshot.name,
          size: createDto.screenshot.size,
          metadata: { type: 'product-cover', userId: userId?.toString() },
        },
        token,
      );
    }

    const savedTicket = await this.supportTicketRepository.create({
      userId,
      subject: createDto.subject,
      message: createDto.message,
      status: SupportTicketStatus.OPEN,
      screenshot: supportMedia?.url ?? null,
    });

    this.webSocketGateway.emitSupportTicketCreated({
      ticketId: savedTicket.id,
      userId,
      subject: savedTicket.subject,
      status: savedTicket.status,
      createdAt: savedTicket.createdAt,
    });

    return { ticket: this.transformTicket(savedTicket), media: supportMedia };
  }

  async findAllByUser(userId: number, query: SupportTicketQueryDto): Promise<SupportTicketsResponse> {
    const {
      limit = 20,
      offset = 0,
      status,
      sortBy = SupportTicketSortBy.CREATED_AT,
      sortOrder = SupportTicketSortOrder.DESC,
    } = query;

    let tickets = await this.supportTicketRepository.findAllByUserId(userId);

    if (status) {
      tickets.data = tickets.data.filter((t) => t.status === status);
    }
    tickets.data = sortTickets(tickets.data, sortBy, sortOrder);

    return {
      tickets: tickets.data.map((t) => this.transformTicket(t)),
      total: tickets.total,
      limit,
      offset,
    };
  }

  async findOneByUser(ticketId: number, userId: number): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepository.findOne(ticketId, userId);
    if (!ticket) throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    return this.transformTicket(ticket);
  }

  async deleteByUser(ticketId: number, userId: number): Promise<void> {
    await this.supportTicketRepository.findOne(ticketId, userId);
    await this.supportTicketRepository.delete(ticketId);
  }

  async findAllAdmin(query: SupportTicketQueryDto): Promise<SupportTicketsResponse> {
    const {
      limit = 20,
      offset = 0,
      status,
      sortBy = SupportTicketSortBy.CREATED_AT,
      sortOrder = SupportTicketSortOrder.DESC,
    } = query;

    let tickets = await this.supportTicketRepository.findAll();

    if (status) {
      tickets.data = tickets.data.filter((t) => t.status === status);
    }
    tickets.data = sortTickets(tickets.data, sortBy, sortOrder);

    return {
      tickets: tickets.data.map((t) => this.transformTicket(t)),
      total: tickets.total,
      limit,
      offset,
    };
  }

  async findOneAdmin(ticketId: number): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepository.findOne(ticketId);
    if (!ticket) throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    return this.transformTicket(ticket);
  }

  async replyToTicket(ticketId: number, replyDto: ReplyToTicketDto): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepository.findOne(ticketId);
    if (!ticket) throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }

    ticket.adminResponse = replyDto.response;
    if (ticket.status === SupportTicketStatus.OPEN) {
      ticket.status = SupportTicketStatus.IN_PROGRESS;
    }

    const updated = await this.supportTicketRepository.update(ticketId, ticket);

    this.webSocketGateway.emitSupportTicketReplied({
      ticketId: updated.id,
      userId: updated.userId,
      response: updated.adminResponse || '',
      status: updated.status,
      updatedAt: updated.updatedAt,
    });

    return this.transformTicket(updated);
  }

  async updateStatus(ticketId: number, updateDto: UpdateTicketStatusDto): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepository.findOne(ticketId);
    if (!ticket) throw new NotFoundException(`Ticket with ID ${ticketId} not found`);

    ticket.status = updateDto.status;
    const updated = await this.supportTicketRepository.update(ticketId, ticket);

    this.webSocketGateway.emitSupportTicketStatusUpdated({
      ticketId: updated.id,
      userId: updated.userId,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });

    return this.transformTicket(updated);
  }

  // ─── Chat messages ────────────────────────────────────────────────────────────

  async getMessages(
    ticketId: number,
    requesterId: number,
    isAdmin: boolean,
    query: GetMessagesQueryDto,
  ): Promise<SupportMessageResponseDto[]> {
    if (!isAdmin) {
      await this.supportTicketRepository.findOne(ticketId, requesterId);
    } else {
      await this.supportTicketRepository.findOne(ticketId);
    }

    const messages = await this.supportMessageRepository.findByTicket(
      ticketId,
      query.limit ?? 50,
      query.beforeId,
    );

    return messages.map((m) => this.transformMessage(m));
  }

  async sendMessage(
    ticketId: number,
    senderId: number,
    senderType: MessageSenderType,
    content: string,
    attachments: SupportMessageAttachment[] = [],
  ): Promise<SupportMessageResponseDto> {
    const normalizedContent = content?.trim() ?? '';
    const normalizedAttachments = this.normalizeAttachments(attachments);

    if (!normalizedContent && normalizedAttachments.length === 0) {
      throw new BadRequestException('Message must contain text or at least one attachment');
    }

    const ticket = await this.supportTicketRepository.findOne(ticketId);

    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Cannot send a message to a closed ticket');
    }

    const message = await this.supportMessageRepository.create({
      ticketId,
      senderId,
      senderType,
      content: normalizedContent,
      attachments: normalizedAttachments,
    });

    if (senderType === 'admin') {
      await this.supportTicketRepository.update(ticketId, {
        lastAdminMessageAt: message.createdAt,
        status:
          ticket.status === SupportTicketStatus.OPEN
            ? SupportTicketStatus.IN_PROGRESS
            : ticket.status,
      });
    }

    return this.transformMessage(message);
  }

  async editMessage(
    messageId: number,
    requesterId: number,
    isAdmin: boolean,
    content: string,
  ): Promise<SupportMessageResponseDto> {
    const message = await this.supportMessageRepository.findOne(messageId);

    if (!isAdmin && message.senderId !== requesterId) {
      throw new ForbiddenException('Cannot edit another user\'s message');
    }

    const updated = await this.supportMessageRepository.update(messageId, {
      content,
      editedAt: new Date(),
    });

    return this.transformMessage(updated);
  }

  async markAdminSeen(ticketId: number): Promise<void> {
    await this.supportTicketRepository.update(ticketId, { adminSeen: true });
  }

  async markUserRead(ticketId: number): Promise<void> {
    await this.supportTicketRepository.update(ticketId, { userLastReadAt: new Date() });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private transformTicket(ticket: SupportTicket): SupportTicketResponseDto {
    const hasUnreadAdminMessage =
      ticket.lastAdminMessageAt !== null &&
      ticket.lastAdminMessageAt !== undefined &&
      (ticket.userLastReadAt === null ||
        ticket.userLastReadAt === undefined ||
        ticket.lastAdminMessageAt > ticket.userLastReadAt);

    return {
      id: ticket.id,
      userId: ticket.userId,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      adminResponse: ticket.adminResponse,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      adminSeen: ticket.adminSeen ?? false,
      hasUnreadAdminMessage,
    };
  }

  private transformMessage(message: any): SupportMessageResponseDto {
    return {
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      attachments: message.attachments ?? [],
      createdAt: message.createdAt,
      editedAt: message.editedAt ?? null,
    };
  }

  private normalizeAttachments(attachments: SupportMessageAttachment[]): SupportMessageAttachment[] {
    if (!attachments?.length) return [];

    const normalized = attachments
      .map((attachment) => ({
        url: attachment.url?.trim(),
        type: attachment.type,
        name: attachment.name?.trim() || undefined,
      }))
      .filter((attachment) => attachment.url);

    if (normalized.length > 10) {
      throw new BadRequestException('Maximum 10 attachments allowed per message');
    }

    return normalized;
  }
}
