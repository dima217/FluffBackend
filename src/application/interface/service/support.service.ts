import { CreateSupportTicketDto, SupportTicketResponseDto, SupportTicketQueryDto, ReplyToTicketDto, UpdateTicketStatusDto } from "@application/dto/support.dto";
import { SupportTicketsResponse } from "@application/service/support.service";
import { CreateMediaResponseDto } from "./media.service";

export interface ISupportService {
  create(userId: number, createDto: CreateSupportTicketDto, token: string): Promise<{ ticket: SupportTicketResponseDto, media: CreateMediaResponseDto | null}>;
  findAllByUser(userId: number, query: SupportTicketQueryDto): Promise<SupportTicketsResponse>;
  findOneByUser(ticketId: number, userId: number): Promise<SupportTicketResponseDto>;
  findAllAdmin(query: SupportTicketQueryDto): Promise<SupportTicketsResponse>;
  findOneAdmin(ticketId: number): Promise<SupportTicketResponseDto>;
  replyToTicket(ticketId: number, replyDto: ReplyToTicketDto): Promise<SupportTicketResponseDto>;
  updateStatus(ticketId: number, updateDto: UpdateTicketStatusDto): Promise<SupportTicketResponseDto>;
}