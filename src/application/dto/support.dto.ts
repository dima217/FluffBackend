import { SupportTicketStatus } from '@domain/entities/support-ticket.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
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