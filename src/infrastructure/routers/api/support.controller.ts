import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiBearerAuth,
    ApiQuery,
  } from '@nestjs/swagger';
  import { SupportService } from '@application/service/support.service';
  import { CreateSupportTicketDto } from '@application/dto/support.dto';
  import { SupportTicketQueryDto } from '@application/dto/support.dto';
  import { SupportTicketResponseDto } from '@application/dto/support.dto';
  import { JwtAuthGuard } from '@infrastructure/guards/jwt-auth.guard';
  import { SupportTicketStatus } from '@domain/entities/support-ticket.entity';
  import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
  import type { User as UserEntity } from '@domain/entities/user.entity';
import { Token } from '@infrastructure/decorator/token.decorator';
import { CreateMediaResponseDto } from '@application/interface/service/media.service';
  
  @ApiTags('Support')
  @Controller('support')
  @ApiBearerAuth()
  export class SupportController {
    constructor(private readonly supportService: SupportService) {}
  
    // ========== USER ENDPOINTS ==========
  
    @Post('tickets')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
      summary: 'Create a new support ticket',
      description:
        'Allows authenticated users to create a new support ticket with a subject and message.',
    })
    @ApiBody({
      type: CreateSupportTicketDto,
      examples: {
        example1: {
          summary: 'Order issue',
          value: {
            subject: 'Проблема с заказом #12345',
            message:
              'Мой заказ не был доставлен в указанное время. Пожалуйста, помогите разобраться.',
          },
        },
        example2: {
          summary: 'Product question',
          value: {
            subject: 'Вопрос о товаре',
            message: 'Хочу узнать, когда будет доступен товар в размере XL?',
          },
        },
      },
    })
    @ApiResponse({
      status: 201,
      description: 'Ticket created successfully',
      type: SupportTicketResponseDto,
    })
    @ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    })
    @ApiResponse({
      status: 400,
      description: 'Bad Request - Validation error',
    })
    async create(
      @UserDecorator() user: UserEntity,
      @Body() createDto: CreateSupportTicketDto,
      @Token() token: string,
    ): Promise<{ticket: SupportTicketResponseDto, media: CreateMediaResponseDto | null}> {
      return await this.supportService.create(user.id, createDto, token);
    }
  
    @Get('tickets')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
      summary: 'Get all tickets for current user',
      description:
        'Retrieves all support tickets created by the authenticated user. Supports pagination, filtering by status, and sorting.',
    })
    @ApiQuery({
      name: 'limit',
      type: Number,
      required: false,
      description: 'Number of tickets per page (default: 20, max: 100)',
      example: 20,
    })
    @ApiQuery({
      name: 'offset',
      type: Number,
      required: false,
      description: 'Number of tickets to skip (default: 0)',
      example: 0,
    })
    @ApiQuery({
      name: 'status',
      enum: SupportTicketStatus,
      required: false,
      description: 'Filter by ticket status',
    })
    @ApiQuery({
      name: 'sortBy',
      enum: ['createdAt', 'updatedAt', 'status'],
      required: false,
      description: 'Field to sort by (default: createdAt)',
    })
    @ApiQuery({
      name: 'sortOrder',
      enum: ['asc', 'desc'],
      required: false,
      description: 'Sort order (default: desc)',
    })
    @ApiResponse({
      status: 200,
      description: 'Tickets retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          tickets: {
            type: 'array',
            items: { $ref: '#/components/schemas/SupportTicketResponseDto' },
          },
          total: { type: 'number', example: 10 },
          limit: { type: 'number', example: 20 },
          offset: { type: 'number', example: 0 },
        },
      },
    })
    @ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    })
    async findAllByUser(@UserDecorator() user: UserEntity, @Query() query: SupportTicketQueryDto) {
      return await this.supportService.findAllByUser(user.id, query);
    }
  
    @Get('tickets/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
      summary: 'Get a single ticket by ID',
      description: 'Retrieves a specific support ticket. Users can only access their own tickets.',
    })
    @ApiParam({
      name: 'id',
      type: Number,
      description: 'Ticket ID',
      example: 1,
    })
    @ApiResponse({
      status: 200,
      description: 'Ticket retrieved successfully',
      type: SupportTicketResponseDto,
    })
    @ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    })
    @ApiResponse({
      status: 404,
      description: 'Ticket not found',
    })
    async findOneByUser(@UserDecorator() user: UserEntity, @Param('id') id: string): Promise<SupportTicketResponseDto> {
      return await this.supportService.findOneByUser(parseInt(id, 10), user.id);
    }
}
  