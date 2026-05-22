import {
  CreateSupportTicketDto,
  SupportTicketResponseDto,
  SupportTicketQueryDto,
  ReplyToTicketDto,
  UpdateTicketStatusDto,
  SupportMessageResponseDto,
  GetMessagesQueryDto,
} from '@application/dto/support.dto';
import { SupportTicketsResponse } from '@application/service/support.service';
import { CreateMediaResponseDto } from './media.service';
import type { MessageSenderType, SupportMessageAttachment } from '@domain/entities/support-message.entity';

export interface ISupportService {
  create(
    userId: number,
    createDto: CreateSupportTicketDto,
    token: string,
  ): Promise<{ ticket: SupportTicketResponseDto; media: CreateMediaResponseDto | null }>;
  findAllByUser(userId: number, query: SupportTicketQueryDto): Promise<SupportTicketsResponse>;
  findOneByUser(ticketId: number, userId: number): Promise<SupportTicketResponseDto>;
  deleteByUser(ticketId: number, userId: number): Promise<void>;
  findAllAdmin(query: SupportTicketQueryDto): Promise<SupportTicketsResponse>;
  findOneAdmin(ticketId: number): Promise<SupportTicketResponseDto>;
  replyToTicket(ticketId: number, replyDto: ReplyToTicketDto): Promise<SupportTicketResponseDto>;
  updateStatus(ticketId: number, updateDto: UpdateTicketStatusDto): Promise<SupportTicketResponseDto>;

  // Chat methods
  getMessages(
    ticketId: number,
    requesterId: number,
    isAdmin: boolean,
    query: GetMessagesQueryDto,
  ): Promise<SupportMessageResponseDto[]>;
  sendMessage(
    ticketId: number,
    senderId: number,
    senderType: MessageSenderType,
    content: string,
    attachments?: SupportMessageAttachment[],
  ): Promise<SupportMessageResponseDto>;
  editMessage(
    messageId: number,
    requesterId: number,
    isAdmin: boolean,
    content: string,
  ): Promise<SupportMessageResponseDto>;
  markAdminSeen(ticketId: number): Promise<void>;
  markUserRead(ticketId: number): Promise<void>;
}
