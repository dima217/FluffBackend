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
import { PaginationQueryDto, PaginatedResponseDto } from '@application/dto/pagination.dto';
import { CreateRecipeDto, RecipeResponseDto, UpdateRecipeDto } from '@application/dto/recipe.dto';
import { CreateProductDto, ProductResponseDto, UpdateProductDto } from '@application/dto/product.dto';
import { TrackingResponseDto } from '@application/dto/tracking.dto';
import { IsSuperGuard } from '@infrastructure/guards/is-super.guard';
import { JwtAuthGuard } from '@infrastructure/guards/jwt-auth.guard';

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
  async getRecipes(@Query() pagination: PaginationQueryDto) {
    return await this.recipeService.findAll(null, pagination.page || 1, pagination.limit || 10);
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
}
