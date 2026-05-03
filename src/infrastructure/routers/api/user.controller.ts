import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Req,
  Res,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserAuthService } from '@application/service/user.auth';
import { ProfileService } from '@application/service/profile.service';
import {
  UserLoginDto,
  UserRecoveryConfirmDto,
  UserRecoveryInitDto,
  UserSignUpDto,
  UserSignUpInitDto,
  MessageResponseDto,
  JwtTokensDto,
} from '@application/dto/user.dto';
import { UpdateProfileDto, ProfileResponseDto } from '@application/dto/profile.dto';
import { UserUtils } from '@infrastructure/utils/user.util';
import { AuditContextMapper } from '@application/mapper';
import { User as User } from '@infrastructure/decorator/user.decorator';
import { Public } from '@infrastructure/decorator/public.decorator';
import type { Response, Request } from 'express';
import type { User as UserEntity } from '@domain/entities/user.entity';
import { Profile } from '@domain/entities/profile.entity';
import { FcmTokenService } from '@application/service/fcm-token.service';
import { MarkNotificationsReadDto, UpdateFcmTokenDto } from '@application/dto/token.dto';
import { NotificationService } from '@application/service/notification.service';

@ApiTags('User Authentication')
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly profileService: ProfileService,
    private readonly fcmTokenService: FcmTokenService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('sign-up-init')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initialize user registration',
    description: 'Send verification code to email for registration',
  })
  @ApiBody({ type: UserSignUpInitDto })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid email' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async signUpInit(
    @Body() signUpInitDto: UserSignUpInitDto,
    @Req() request: Request,
  ): Promise<MessageResponseDto> {
    const auditContext = AuditContextMapper.fromRequest(request);
    await this.userAuthService.signUpInit(signUpInitDto, auditContext);
    return { message: 'Verification code sent to your email' };
  }

  @Post('sign-up')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Complete user registration',
    description:
      'Register new user with verification code. Required fields for calorie tracking: gender, birthDate (for age calculation), height, and weight.',
  })
  @ApiBody({ type: UserSignUpDto })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: JwtTokensDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or code' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  async signUp(
    @Body() signUpDto: UserSignUpDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const auditContext = AuditContextMapper.fromRequest(request);
    const jwtTokens = await this.userAuthService.signUp(signUpDto, auditContext);
    UserUtils.setJwtTokensResponse(jwtTokens, response);
    return response;
  }

  @Post('sign-in')
  @Public()
  @ApiOperation({ summary: 'User login', description: 'Authenticate user and get JWT tokens' })
  @ApiBody({ type: UserLoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: JwtTokensDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async signIn(
    @Body() signInDto: UserLoginDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const auditContext = AuditContextMapper.fromRequest(request);
    const jwtTokens = await this.userAuthService.signIn(signInDto, auditContext);
    UserUtils.setJwtTokensResponse(jwtTokens, response);
    return response;
  }

  @Post('admin/sign-in')
  @Public()
  @ApiOperation({ 
    summary: 'Admin login', 
    description: 'Authenticate admin user (must have isSuper=true) and get JWT tokens' 
  })
  @ApiBody({ type: UserLoginDto })
  @ApiResponse({ status: 200, description: 'Admin login successful', type: JwtTokensDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials or not an admin' })
  @ApiResponse({ status: 403, description: 'User is not an admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async adminSignIn(
    @Body() signInDto: UserLoginDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const auditContext = AuditContextMapper.fromRequest(request);
    const jwtTokens = await this.userAuthService.adminSignIn(signInDto, auditContext);
    UserUtils.setJwtTokensResponse(jwtTokens, response);
    return response;
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Sign out user and invalidate refresh token',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signOut(@User() user: UserEntity, @Req() request: Request, @Res() response: Response) {
    this.logger.log(`Sign-out request for user ID: ${user.id}`);
    const auditContext = AuditContextMapper.fromRequest(request);
    await this.userAuthService.signOut(user.id, auditContext);
    response.clearCookie('refreshToken');
    this.logger.log(
      `Sign-out successful for user ID: ${user.id}, response status: ${response.statusCode}`,
    );
    return response;
  }

  @Post('new-access-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get new access token',
    description: 'Refresh access token using refresh token from cookie',
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'New access token generated',
    schema: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async newAccessToken(@Req() request: Request) {
    const refreshToken = UserUtils.getRefreshTokenFromRequest(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return await this.userAuthService.newAccessToken(refreshToken);
  }

  @Post('recovery-init')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initialize password recovery',
    description: 'Send recovery code to user email',
  })
  @ApiBody({ type: UserRecoveryInitDto })
  @ApiResponse({ status: 200, description: 'Recovery code sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async recoveryInit(@Body() recoveryInitDto: UserRecoveryInitDto) {
    await this.userAuthService.recoveryInit(recoveryInitDto.username);
  }

  @Post('recovery-confirm')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm password recovery',
    description: 'Reset password with recovery code',
  })
  @ApiBody({ type: UserRecoveryConfirmDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or code' })
  @ApiResponse({ status: 401, description: 'Invalid recovery code' })
  async recoveryConfirm(
    @Body() recoveryConfirmDto: UserRecoveryConfirmDto,
    @Req() request: Request,
  ) {
    const auditContext = AuditContextMapper.fromRequest(request);
    await this.userAuthService.recoveryConfirm(recoveryConfirmDto, auditContext);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ProfileResponseDto })
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get current user profile with user information',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: Profile })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@User() user: UserEntity): Promise<Profile> {
    return await this.profileService.getProfile(user.id);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update current user profile (partial update)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: Profile })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateProfile(
    @User() user: UserEntity,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<Profile> {
    return await this.profileService.updateProfile(user.id, updateDto);
  }

  @Post('/fcm-token')
  @ApiOperation({
    summary: 'Register FCM device token',
    description:
      'Stores Firebase Cloud Messaging token for push notifications. Send null or empty to clear.',
  })
  @ApiBody({ type: UpdateFcmTokenDto })
  @ApiResponse({ status: 200, description: 'Token saved' })
  async registerFcmToken(
    @User() user: UserEntity, 
    @Body() body: UpdateFcmTokenDto) {
    const raw = body.token;
    const token =
      raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '')
        ? null
        : raw.trim();
    await this.fcmTokenService.saveFcmToken(user.id, token);
    return { success: true };
  }

  @Get('/notifications')
  @ApiOperation({
    summary: 'Get my notifications',
    description: 'Returns notifications for authenticated user ordered by newest first.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: 'Notifications list' })
  async getMyNotifications(
    @User() user: UserEntity, 
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
    const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
    return this.notificationService.getUserNotifications(user.id, parsedLimit, parsedOffset);
  }

  @Post('/notifications/read')
  @ApiOperation({
    summary: 'Mark notifications as read',
    description: 'Marks selected notifications as read for authenticated user.',
  })
  @ApiBody({ type: MarkNotificationsReadDto })
  @ApiResponse({ status: 200, description: 'Notifications updated' })
  async markNotificationsAsRead(
    @User() user: UserEntity, 
    @Body() body: MarkNotificationsReadDto,
  ) {
    await this.notificationService.markAsRead(user.id, body.ids);
    return { success: true };
  }
}
