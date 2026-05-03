import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';
import { ViewCacheService } from '@infrastructure/service/view-cache.service';
import { RecipeService } from '@application/service/recipe.service';
import { ProductService } from '@application/service/product.service';
import { TrackingService } from '@application/service/tracking.service';
import { ReviewService } from '@application/service/review.service';
import { AuditLogService } from '@application/service/audit-log.service';
import { UserAuthService } from '@application/service/user.auth';
import { PaginationQueryDto } from '@application/dto/pagination.dto';
import { CreateRecipeDto, RecipeResponseDto, UpdateRecipeDto } from '@application/dto/recipe.dto';
import { CreateProductDto, ProductResponseDto, UpdateProductDto } from '@application/dto/product.dto';
import { IsSuperGuard } from '@infrastructure/guards/is-super.guard';
import { JwtAuthGuard } from '@infrastructure/guards/jwt-auth.guard';
import { SupportTicketQueryDto, SupportTicketResponseDto, ReplyToTicketDto, UpdateTicketStatusDto } from '@application/dto/support.dto';
import { SupportTicketStatus } from '@domain/entities/support-ticket.entity';
import { SupportService } from '@application/service/support.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, IsSuperGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(
    private readonly viewCacheService: ViewCacheService,
    private readonly recipeService: RecipeService,
    private readonly productService: ProductService,
    private readonly trackingService: TrackingService,
    private readonly reviewService: ReviewService,
    private readonly auditLogService: AuditLogService,
    private readonly userAuthService: UserAuthService,
    private readonly supportService: SupportService,
  ) {}

  @Get('auth-activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get auth activity timeseries (admin)',
    description: 'Return registrations and logins count per day based on audit logs',
  })
  @ApiQuery({ name: 'dateStart', required: true, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateEnd', required: true, type: String, description: 'ISO date string' })
  @ApiResponse({ status: 200, description: 'Auth activity retrieved successfully' })
  async getAuthActivity(
    @Query('dateStart') dateStart: string,
    @Query('dateEnd') dateEnd: string,
  ) {
    return await this.auditLogService.getAuthActivityByDay(new Date(dateStart), new Date(dateEnd));
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get admin statistics',
    description: 'Get aggregated statistics from cached view',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return await this.viewCacheService.getStats();
  }

  @Post('stats/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh statistics view',
    description: 'Manually refresh the admin statistics view cache',
  })
  @ApiResponse({ status: 200, description: 'Statistics view refreshed successfully' })
  async refreshStats() {
    await this.viewCacheService.refreshStatsView();
    return { message: 'Statistics view refreshed successfully' };
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users (admin)',
    description: 'Get paginated list of all users',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query() pagination: PaginationQueryDto) {
    return await this.userAuthService.findAllAdmin(
      pagination.page || 1,
      pagination.limit || 10,
    );
  }

  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID (admin)',
    description: 'Get user details by ID',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userAuthService.findOneAdmin(id);
  }

  @Put('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user (admin)',
    description: 'Update user information',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, username: { type: 'string' }, email: { type: 'string' }, isActive: { type: 'boolean' }, isSuper: { type: 'boolean' } } } })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() userData: any) {
    return await this.userAuthService.updateUserAdmin(id, userData);
  }

  @Put('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate/Deactivate user (admin)',
    description: 'Toggle user active status',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { type: 'object', properties: { isActive: { type: 'boolean' } } } })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async toggleUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return await this.userAuthService.updateUserStatusAdmin(id, isActive);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user (admin)',
    description: 'Soft delete a user',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.userAuthService.deleteUserAdmin(id);
    return { message: 'User deleted successfully' };
  }

  @Get('recipes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all recipes (admin)',
    description: 'Get paginated list of all recipes',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recipes retrieved successfully' })
  async getRecipes(@Query() pagination: PaginationQueryDto, @UserDecorator() user: UserEntity) {
    return await this.recipeService.findAll(user.id, pagination.page || 1, pagination.limit || 10);
  }

  @Get('recipes/requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all recipes (admin)',
    description: 'Get paginated list of all recipes',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recipes retrieved successfully' })
  async getRequests(@Query() pagination: PaginationQueryDto,
) {
    return await this.recipeService.findRequests(null, pagination.page || 1, pagination.limit || 10);
  }

  @Get('recipes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get recipe by ID (admin)',
    description: 'Get recipe details by ID',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Recipe retrieved successfully', type: RecipeResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async getRecipe(@Param('id', ParseIntPipe) id: number) {
    return await this.recipeService.findOne(id);
  }

  @Delete('recipes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete recipe (admin)',
    description: 'Delete a recipe',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Recipe deleted successfully' })
  async deleteRecipe(@Param('id', ParseIntPipe) id: number) {
    await this.recipeService.delete(id, null);
    return { message: 'Recipe deleted successfully' };
  }

  @Post('recipes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create recipe (admin)',
    description: 'Create a recipe as admin (owner is null)',
  })
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({ status: 201, description: 'Recipe created successfully', type: RecipeResponseDto })
  async createRecipe(@Body() createDto: CreateRecipeDto) {
    return await this.recipeService.create(null, createDto);
  }

  @Put('recipes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update recipe (admin)',
    description: 'Update any recipe as admin (bypasses ownership check)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateRecipeDto })
  @ApiResponse({ status: 200, description: 'Recipe updated successfully', type: RecipeResponseDto })
  async updateRecipe(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateRecipeDto) {
    return await this.recipeService.update(id, null, updateDto);
  }

  @Get('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all products (admin)',
    description: 'Get paginated list of all products',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProducts(@Query() pagination: PaginationQueryDto) {
    return await this.productService.findAll(null, pagination.page || 1, pagination.limit || 10);
  }

  @Get('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get product by ID (admin)',
    description: 'Get product details by ID',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.findOne(id, null);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create product (admin)',
    description: 'Create a product as admin',
  })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto })
  async createProduct(@Body() createDto: CreateProductDto) {
    return await this.productService.create(createDto);
  }

  @Put('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update product (admin)',
    description: 'Update a product as admin',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: ProductResponseDto })
  async updateProduct(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProductDto) {
    return await this.productService.update(id, updateDto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete product (admin)',
    description: 'Delete a product',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    await this.productService.delete(id);
    return { message: 'Product deleted successfully' };
  }

  @Get('reviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all reviews (admin)',
    description: 'Get paginated list of all reviews',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getReviews(@Query() pagination: PaginationQueryDto) {
    return await this.reviewService.findAllAdmin(pagination.page || 1, pagination.limit || 10);
  }

  @Get('tracking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all tracking records (admin)',
    description: 'Get paginated list of all tracking records',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Tracking records retrieved successfully' })
  async getTracking(@Query() pagination: PaginationQueryDto) {
    return await this.trackingService.findAllPaginated(pagination.page || 1, pagination.limit || 10);
  }

  @Get('/tickets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all tickets (Admin only)',
    description:
      'Retrieves all support tickets in the system. Supports pagination, filtering by status, and sorting. Only accessible by administrators.',
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
        total: { type: 'number', example: 50 },
        limit: { type: 'number', example: 20 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async findAllAdmin(@Query() query: SupportTicketQueryDto) {
    return await this.supportService.findAllAdmin(query);
  }

  @Get('/tickets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get a single ticket by ID (Admin only)',
    description:
      'Retrieves detailed information about a specific support ticket. Only accessible by administrators.',
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
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async findOneAdmin(@Param('id') id: string): Promise<SupportTicketResponseDto> {
    return await this.supportService.findOneAdmin(parseInt(id, 10));
  }

  @Patch('/tickets/:id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Reply to a ticket (Admin only)',
    description:
      'Allows administrators to reply to a support ticket. The ticket status will automatically change to "in_progress" if it was "open".',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Ticket ID',
    example: 1,
  })
  @ApiBody({
    type: ReplyToTicketDto,
    examples: {
      example1: {
        summary: 'Standard reply',
        value: {
          response:
            'Спасибо за обращение. Мы проверили ваш заказ и связались с курьером. Заказ будет доставлен сегодня до 18:00.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reply sent successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot reply to closed ticket or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async replyToTicket(
    @Param('id') id: string,
    @Body() replyDto: ReplyToTicketDto,
  ): Promise<SupportTicketResponseDto> {
    return await this.supportService.replyToTicket(parseInt(id, 10), replyDto);
  }

  @Patch('/tickets/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update ticket status (Admin only)',
    description:
      'Allows administrators to change the status of a support ticket (open, in_progress, resolved, closed).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Ticket ID',
    example: 1,
  })
  @ApiBody({
    type: UpdateTicketStatusDto,
    examples: {
      example1: {
        summary: 'Mark as resolved',
        value: {
          status: 'resolved',
        },
      },
      example2: {
        summary: 'Close ticket',
        value: {
          status: 'closed',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTicketStatusDto,
  ): Promise<SupportTicketResponseDto> {
    return await this.supportService.updateStatus(parseInt(id, 10), updateDto);
  }
}
