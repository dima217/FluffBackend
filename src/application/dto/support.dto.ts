import { SupportTicketStatus } from '@domain/entities/support-ticket.entity';
import type { MessageSenderType, SupportMessageAttachmentType } from '@domain/entities/support-message.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional, IsInt, Min, Max, IsArray, ValidateNested, ArrayMaxSize, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import type { Media } from '@domain/types/media.type';

export class CreateSupportTicketDto {
  @ApiProperty({
    description: 'Ticket subject',
    example: 'Проблема с заказом #12345',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    description: 'Ticket message/description',
    example: 'Мой заказ не был доставлен в указанное время. Пожалуйста, помогите разобраться.',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  message: string;


  @IsOptional()
  screenshot: Media;
}

export class ReplyToTicketDto {
    @ApiProperty({
      description: 'Admin response to the ticket',
      example: 'Спасибо за обращение. Мы проверили ваш заказ и связались с курьером. Заказ будет доставлен сегодня до 18:00.',
      minLength: 10,
      maxLength: 5000,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(5000)
    response: string;
  }
  
  export enum SupportTicketSortBy {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    STATUS = 'status',
  }
  
  export enum SupportTicketSortOrder {
    ASC = 'asc',
    DESC = 'desc',
  }
  
  export class SupportTicketQueryDto {
    @ApiPropertyOptional({
      description: 'Number of tickets to return',
      example: 20,
      default: 20,
      minimum: 1,
      maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
  
    @ApiPropertyOptional({
      description: 'Number of tickets to skip',
      example: 0,
      default: 0,
      minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
  
    @ApiPropertyOptional({
      description: 'Filter by ticket status',
      enum: SupportTicketStatus,
      example: SupportTicketStatus.OPEN,
    })
    @IsOptional()
    @IsEnum(SupportTicketStatus)
    status?: SupportTicketStatus;
  
    @ApiPropertyOptional({
      description: 'Sort field',
      enum: SupportTicketSortBy,
      example: SupportTicketSortBy.CREATED_AT,
      default: SupportTicketSortBy.CREATED_AT,
    })
    @IsOptional()
    @IsEnum(SupportTicketSortBy)
    sortBy?: SupportTicketSortBy = SupportTicketSortBy.CREATED_AT;
  
    @ApiPropertyOptional({
      description: 'Sort order',
      enum: SupportTicketSortOrder,
      example: SupportTicketSortOrder.DESC,
      default: SupportTicketSortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SupportTicketSortOrder)
    sortOrder?: SupportTicketSortOrder = SupportTicketSortOrder.DESC;
  }
  
  
  export class SupportTicketResponseDto {
    @ApiProperty({ description: 'Ticket ID', example: 1 })
    id: number;
  
    @ApiProperty({ description: 'User ID who created the ticket', example: 1 })
    userId: number;
  
    @ApiProperty({ description: 'Ticket subject', example: 'Проблема с заказом #12345' })
    subject: string;
  
    @ApiProperty({
      description: 'Ticket message/description',
      example: 'Мой заказ не был доставлен в указанное время',
    })
    message: string;
  
    @ApiProperty({
      description: 'Ticket status',
      enum: SupportTicketStatus,
      example: SupportTicketStatus.OPEN,
    })
    status: SupportTicketStatus;
  
    @ApiProperty({
      description: 'Admin response to the ticket',
      nullable: true,
      example: 'Спасибо за обращение. Мы проверим ваш заказ.',
    })
    adminResponse: string | null;
  
    @ApiProperty({ description: 'Date when ticket was created' })
    createdAt: Date;
  
    @ApiProperty({ description: 'Date when ticket was last updated' })
    updatedAt: Date;

    @ApiProperty({ description: 'Whether admin has seen this ticket', example: false })
    adminSeen: boolean;

    @ApiProperty({ description: 'Whether there are unread admin messages for the user', example: false })
    hasUnreadAdminMessage: boolean;
  }

  export class SupportMessageAttachmentDto {
    @ApiProperty({ description: 'Attachment URL', example: 'https://cdn.example.com/support/screenshot.png' })
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiPropertyOptional({ description: 'Attachment type', enum: ['image', 'file'], example: 'image' })
    @IsOptional()
    @IsIn(['image', 'file'])
    type?: SupportMessageAttachmentType;

    @ApiPropertyOptional({ description: 'Original file name', example: 'screenshot.png' })
    @IsOptional()
    @IsString()
    name?: string;
  }

  export class SupportMessageResponseDto {
    @ApiProperty({ description: 'Message ID', example: 1 })
    id: number;

    @ApiProperty({ description: 'Ticket ID', example: 1 })
    ticketId: number;

    @ApiProperty({ description: 'Sender user ID', example: 1 })
    senderId: number;

    @ApiProperty({ description: 'Sender type', enum: ['user', 'admin'], example: 'user' })
    senderType: MessageSenderType;

    @ApiProperty({ description: 'Message content', example: 'Hello, I need help.' })
    content: string;

    @ApiProperty({
      description: 'Attached files or images',
      type: [SupportMessageAttachmentDto],
      example: [{ url: 'https://cdn.example.com/support/screenshot.png', type: 'image', name: 'screenshot.png' }],
    })
    attachments: SupportMessageAttachmentDto[];

    @ApiProperty({ description: 'When message was sent' })
    createdAt: Date;

    @ApiProperty({ description: 'When message was last edited', nullable: true })
    editedAt: Date | null;
  }

  export class SendSupportMessageDto {
    @ApiPropertyOptional({ description: 'Message text', maxLength: 5000 })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    content?: string;

    @ApiPropertyOptional({
      description: 'Attached files or images',
      type: [SupportMessageAttachmentDto],
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @ValidateNested({ each: true })
    @Type(() => SupportMessageAttachmentDto)
    attachments?: SupportMessageAttachmentDto[];
  }

  export class GetMessagesQueryDto {
    @ApiPropertyOptional({ description: 'Fetch up to this many messages', example: 50, default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 50;

    @ApiPropertyOptional({ description: 'Load messages before this message ID (for pagination)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    beforeId?: number;
  }

  export class UpdateTicketStatusDto {
    @ApiProperty({
      description: 'New ticket status',
      enum: SupportTicketStatus,
      example: SupportTicketStatus.IN_PROGRESS,
    })
    @IsEnum(SupportTicketStatus)
    status: SupportTicketStatus;
  }