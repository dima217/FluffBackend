import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { SupportTicket, SupportTicketStatus } from '@domain/entities/support-ticket.entity';
import { CreateSupportTicketDto } from '@application/dto/support.dto';
import { ReplyToTicketDto } from '@application/dto/support.dto';
import { UpdateTicketStatusDto } from '@application/dto/support.dto';
import {
  SupportTicketQueryDto,
  SupportTicketSortBy,
  SupportTicketSortOrder,
} from '@application/dto/support.dto';
import { SupportTicketResponseDto } from '@application/dto/support.dto';
import { AppWebSocketGateway } from '@application/gateway/support.gatewat';
import type { ISupportRepository } from '@domain/interface/support.repository';
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

export function sortTickets(tickets: SupportTicket[], sortBy: SupportTicketSortBy, sortOrder: SupportTicketSortOrder) {
  const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
  switch (sortBy) {
    case SupportTicketSortBy.UPDATED_AT:
      tickets.sort((a, b) => orderDirection === 'ASC' ? a.updatedAt.getTime() - b.updatedAt.getTime() : b.updatedAt.getTime() - a.updatedAt.getTime());
      break;
    case SupportTicketSortBy.STATUS:
      tickets.sort((a, b) => orderDirection === 'ASC' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status));
      break;
    case SupportTicketSortBy.CREATED_AT:
      tickets.sort((a, b) => orderDirection === 'ASC' ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime());
      break;
  }
  return tickets;
}

@Injectable()
export class SupportService implements ISupportService {
  constructor(
    @Inject(REPOSITORY_CONSTANTS.SUPPORT_TICKET_REPOSITORY)
    private readonly supportTicketRepository: ISupportRepository,
    private webSocketGateway: AppWebSocketGateway,
    private readonly mediaService: MediaService,
  ) {}

  async create(
    userId: number,
    createDto: CreateSupportTicketDto,
    token: string,
  ): Promise<{ ticket: SupportTicketResponseDto, media: CreateMediaResponseDto | null}> {
    const newTicket = {
      userId,
      subject: createDto.subject,
      message: createDto.message,
      status: SupportTicketStatus.OPEN,
    };

    let supportMedia: CreateMediaResponseDto | null = null;

    if (createDto.screenshot) {
      supportMedia = await this.mediaService.createMedia(
        {
          filename: createDto.screenshot.name,
          size: createDto.screenshot.size,
          metadata: {
            type: 'product-cover',
            userId: userId?.toString(),
          },
        },
        token,
      );
    }  

    const savedTicket = await this.supportTicketRepository.create(newTicket);

    this.webSocketGateway.emitSupportTicketCreated({
      ticketId: savedTicket.id,
      userId,
      subject: savedTicket.subject,
      status: savedTicket.status,
      createdAt: savedTicket.createdAt,
    });

    return {ticket: this.transformTicket(savedTicket), media: supportMedia};
  }

  async findAllByUser(
    userId: number,
    query: SupportTicketQueryDto,
  ): Promise<SupportTicketsResponse> {
    const {
      limit = 20,
      offset = 0,
      status,
      sortBy = SupportTicketSortBy.CREATED_AT,
      sortOrder = SupportTicketSortOrder.DESC,
    } = query;

    let tickets = await this.supportTicketRepository.findAllByUserId(userId);

    if (status) {
      tickets.data = tickets.data.filter((ticket) => ticket.status === status);
    }

    tickets.data = sortTickets(tickets.data, sortBy, sortOrder);

    return {
      tickets: tickets.data.map((ticket) => this.transformTicket(ticket)),
      total: tickets.total,
      limit,
      offset,
    };
  }

  async findOneByUser(ticketId: number, userId: number): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepository.findOne(ticketId, userId);

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    return this.transformTicket(ticket);
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
      tickets.data = tickets.data.filter((ticket) => ticket.status === status);
    }

    tickets.data = sortTickets(tickets.data, sortBy, sortOrder);

    return {
      tickets: tickets.data.map((ticket) => this.transformTicket(ticket)),
      total: tickets.total,
      limit,
      offset,
    };
  }

  async findOneAdmin(ticketId: number): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepository.findOne(ticketId);

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }
    return this.transformTicket(ticket);
  }

  async replyToTicket(
    ticketId: number,
    replyDto: ReplyToTicketDto,
  ): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepository.findOne(ticketId);

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }

    ticket.adminResponse = replyDto.response;
    if (ticket.status === SupportTicketStatus.OPEN) {
      ticket.status = SupportTicketStatus.IN_PROGRESS;
    }

    const updatedTicket = await this.supportTicketRepository.update(ticketId, ticket);

    this.webSocketGateway.emitSupportTicketReplied({
      ticketId: updatedTicket.id,
      userId: updatedTicket.userId,
      response: updatedTicket.adminResponse || '',
      status: updatedTicket.status,
      updatedAt: updatedTicket.updatedAt,
    });

    return this.transformTicket(updatedTicket);
  }

  async updateStatus(
    ticketId: number,
    updateDto: UpdateTicketStatusDto,
  ): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepository.findOne(ticketId);

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    ticket.status = updateDto.status;
    const updatedTicket = await this.supportTicketRepository.update(ticketId, ticket);

    this.webSocketGateway.emitSupportTicketStatusUpdated({
      ticketId: updatedTicket.id,
      userId: updatedTicket.userId,
      status: updatedTicket.status,
      updatedAt: updatedTicket.updatedAt,
    });

    return this.transformTicket(updatedTicket);
  }

  private transformTicket(ticket: SupportTicket): SupportTicketResponseDto {
    return {
      id: ticket.id,
      userId: ticket.userId,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      adminResponse: ticket.adminResponse,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }
}
