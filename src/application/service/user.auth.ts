import {
  JwtTokensDto,
  UserLoginDto,
  UserRecoveryConfirmDto,
  UserSignUpDto,
  UserSignUpInitDto,
} from '@application/dto/user.dto';
import type { ISendCodeProvider } from '@application/interface/provider/code.provider';
import type { ICodeService } from '@application/interface/service/code.serviece';
import { IUserAuthService } from '@application/interface/service/user.auth';
import { Code } from '@domain/entities/code.entity';
import {
  EmailAlreadyExistsException,
  InvalidCodeException,
} from '@domain/exceptions/user.exception';
import { NotFoundEntityException } from '@domain/exceptions/entity.exceptions';
import type { IUserRepository } from '@domain/interface/user.repository';
import { DomainUserService } from '@domain/service/user.serviece';
import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User as UserEntity } from '@domain/entities/user.entity';
import { Profile } from '@domain/entities/profile.entity';
import { Token } from '@domain/entities/token.entity';
import type { IProfileRepository } from '@domain/interface/profile.repository';
import type { ITokenRepository } from '@domain/interface/token.repository';
import { AuditLogService } from './audit-log.service';
import { AuditLogAction } from '@domain/entities/audit-log.entity';
import { AuditContext } from '@application/dto/audit-context.dto';
import { UserMapper, ProfileMapper, TokenMapper, AuditLogMapper } from '@application/mapper';
import { NotificationRegistrationObservable } from './observable/notification.service';
import { PasswordChangeNotificationObservable } from './observable/password-change-notification.service';
import { REPOSITORY_CONSTANTS, PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class UserAuthService implements IUserAuthService {
  private readonly logger = new Logger(UserAuthService.name);

  constructor(
    @Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(REPOSITORY_CONSTANTS.TOKEN_REPOSITORY)
    private readonly tokenRepository: ITokenRepository,

    @Inject(REPOSITORY_CONSTANTS.PROFILE_REPOSITORY)
    private readonly profileRepository: IProfileRepository,

    @Inject(PROVIDER_CONSTANTS.SEND_CODE_PROVIDER)
    private readonly sendCodeProvider: ISendCodeProvider,

    @Inject(PROVIDER_CONSTANTS.CODE_SERVICE)
    private readonly codeService: ICodeService,

    private readonly userDomainService: DomainUserService,

    private readonly auditLogService: AuditLogService,

    private readonly notificationRegistrationObservable: NotificationRegistrationObservable,

    private readonly passwordChangeNotificationObservable: PasswordChangeNotificationObservable,
  ) {}
  async recoveryInit(username: string): Promise<void> {
    this.logger.log(`Recovery init requested for username: ${username}`);
    const userFound = await this.userRepository.findOneByUsername(username);
    const code = await this.codeService.generateCode(userFound.email, Code.Types.recovery);
    this.logger.log(`Generated recovery code ${code.code} for user: ${userFound.email}`);
    this.sendCodeProvider
      .sendCode({
        email: userFound.email,
        code: code.code,
        type: code.type,
        expirationDate: code.expirationDate,
      })
      .catch((error) => {
        this.logger.error(
          `Failed to send recovery code to ${userFound.email}: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  }
  async recoveryConfirm(user: UserRecoveryConfirmDto, auditContext?: AuditContext): Promise<void> {
    this.logger.log(`Recovery confirm requested for username: ${user.username}`);

    let userFound: UserEntity | null = null;

    try {
      userFound = await this.userRepository.findOneByUsername(user.username);
    } catch (error) {
      // Log failed password change attempt - user not found
      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.RECOVERY_CONFIRM_FAILED, auditContext, {
            user: null,
            success: false,
            errorMessage: 'User not found',
            metadata: { username: user.username },
          }),
        );
      }
      throw new InvalidCodeException();
    }

    const isValidCode = await this.codeService.verifyCode(
      user.username,
      user.code,
      Code.Types.recovery,
    );
    if (!isValidCode) {
      this.logger.warn(`Invalid recovery code for username: ${user.username}`);
      // Log failed password change attempt - invalid code
      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.RECOVERY_CONFIRM_FAILED, auditContext, {
            user: userFound,
            success: false,
            errorMessage: 'Invalid recovery code',
            metadata: { username: user.username },
          }),
        );
      }
      throw new InvalidCodeException();
    }

    const encryptedPassword = this.userDomainService.encryptPassword(user.password);
    const updatedUser = await this.userRepository.update(userFound.id, {
      password: encryptedPassword,
    });
    this.logger.log(`Password updated for user: ${user.username}`);

    // Log successful password change
    if (auditContext) {
      this.auditLogService.createLog(
        AuditLogMapper.toCreateDto(AuditLogAction.RECOVERY_CONFIRM_SUCCESS, auditContext, {
          user: updatedUser,
          success: true,
          metadata: { username: user.username, email: updatedUser.email },
        }),
      );
    }

    // Send password change notification email
    this.passwordChangeNotificationObservable.accept(updatedUser).catch((error) => {
      this.logger.error(
        `Failed to send password change notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }
  async signIn(user: UserLoginDto, auditContext?: AuditContext): Promise<JwtTokensDto> {
    this.logger.log(`Sign in attempt for username: ${user.username}`);
    let userFound: UserEntity;

    try {
      userFound = await this.userRepository.findOneByUsername(user.username);
    } catch (error) {
      // Log failed login attempt - user not found
      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.SIGN_IN_FAILED, auditContext, {
            user: null,
            success: false,
            errorMessage: 'User not found',
            metadata: { username: user.username },
          }),
        );
      }
      throw error;
    }

    if (!this.userDomainService.verifyPassword(user.password, userFound.password)) {
      this.logger.warn(`Invalid password for username: ${user.username}`);
      // Логируем неуспешную попытку входа
      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.SIGN_IN_FAILED, auditContext, {
            user: userFound,
            success: false,
            errorMessage: 'Invalid password',
            metadata: { username: user.username },
          }),
        );
      }
      throw new UnauthorizedException('Invalid username or password');
    }
    this.logger.log(`Successful sign in for user: ${user.username}`);

    const [refreshToken, expiresAt] = this.userDomainService.createRefreshToken(userFound);
    const tokenEntity = TokenMapper.toEntity(userFound, refreshToken, expiresAt);
    const token = await this.tokenRepository.create(tokenEntity);

    if (auditContext) {
      this.auditLogService.createLog(
        AuditLogMapper.toCreateDto(AuditLogAction.SIGN_IN_SUCCESS, auditContext, {
          user: userFound,
          success: true,
          metadata: { username: user.username },
        }),
      );
    }

    return this.userDomainService.createJwtTokens(token);
  }
  async signOut(userId: number, auditContext?: AuditContext): Promise<void> {
    this.logger.log(`Sign out requested for user ID: ${userId}`);
    const user = await this.userRepository.findOne(userId);
    await this.tokenRepository.deleteByUserId(userId);
    this.logger.log(`User ${userId} signed out successfully`);

    if (auditContext) {
      this.auditLogService.createLog(
        AuditLogMapper.toCreateDto(AuditLogAction.SIGN_OUT, auditContext, {
          user: user || null,
          success: true,
          metadata: { userId },
        }),
      );
    }
  }
  async newAccessToken(refreshToken: string): Promise<string> {
    this.logger.debug('New access token requested');
    const token = await this.tokenRepository.findOneByToken(refreshToken);
    if (!token) {
      this.logger.warn('Invalid refresh token provided');
      throw new UnauthorizedException('Invalid refresh token');
    }
    this.logger.debug(`New access token generated for user ID: ${token.user.id}`);
    return this.userDomainService.createJwtTokens(token).access;
  }

  async signUpInit(user: UserSignUpInitDto, auditContext?: AuditContext): Promise<void> {
    this.logger.log(`Sign up init requested for email: ${user.email}`);
    const existUser = await this.userRepository.findEmailOrPhone(user.email);

    if (!existUser) {
      const code = await this.codeService.generateCode(user.email, Code.Types.signup);
      this.logger.log(`Generated signup code ${code.code} for email: ${user.email}`);
      this.sendCodeProvider
        .sendCode({
          email: user.email,
          code: code.code,
          type: code.type,
          expirationDate: code.expirationDate,
        })
        .catch((error) => {
          this.logger.error(
            `Failed to send signup code to ${user.email}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });

      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.SIGN_UP_INIT, auditContext, {
            user: null,
            success: true,
            metadata: { email: user.email },
          }),
        );
      }
      return;
    }

    this.logger.warn(`Email already exists: ${user.email}`);
    // Логируем неуспешную попытку регистрации
    if (auditContext) {
      this.auditLogService.createLog(
        AuditLogMapper.toCreateDto(AuditLogAction.SIGN_UP_FAILED, auditContext, {
          user: null,
          success: false,
          errorMessage: 'Email already exists',
          metadata: { email: user.email },
        }),
      );
    }
    throw new EmailAlreadyExistsException();
  }

  async signUp(user: UserSignUpDto, auditContext?: AuditContext): Promise<JwtTokensDto> {
    this.logger.log(`Sign up requested for email: ${user.email}`);
    const isValidCode = await this.codeService.verifyCode(user.email, user.code, Code.Types.signup);
    if (!isValidCode) {
      this.logger.warn(`Invalid signup code for email: ${user.email}`);
      // Логируем неуспешную регистрацию
      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.SIGN_UP_FAILED, auditContext, {
            user: null,
            success: false,
            errorMessage: 'Invalid verification code',
            metadata: { email: user.email },
          }),
        );
      }
      throw new InvalidCodeException();
    }
    this.logger.debug(`Signup code verified for email: ${user.email}`);

    const encryptedPassword = this.userDomainService.encryptPassword(user.password);
    const userEntity = UserMapper.toEntity(user, encryptedPassword);
    const userSaved = await this.userRepository.create(userEntity);

    const profileData = {
      birthDate: user.birthDate,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      sportActivity: user.sportActivity,
      cheatMealDay: user.cheatMealDay,
      periodOfDays: user.periodOfDays,
      bio: '',
      photo: '',
    };
    const profileEntity = ProfileMapper.toEntity(userSaved, profileData);
    await this.profileRepository.create(userSaved.id, profileEntity);

    const [refreshToken, expiresAt] = this.userDomainService.createRefreshToken(userSaved);
    const tokenEntity = TokenMapper.toEntity(userSaved, refreshToken, expiresAt);
    const token = await this.tokenRepository.create(tokenEntity);

    this.logger.log(`User successfully registered: ${user.email} (ID: ${userSaved.id})`);

    if (auditContext) {
      this.auditLogService.createLog(
        AuditLogMapper.toCreateDto(AuditLogAction.SIGN_UP_SUCCESS, auditContext, {
          user: userSaved,
          success: true,
          metadata: { email: user.email },
        }),
      );
    }

    this.notificationRegistrationObservable.accept(userSaved).catch((error) => {
      this.logger.error(
        `Failed to send registration notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    return this.userDomainService.createJwtTokens(token);
  }

  async adminSignIn(user: UserLoginDto, auditContext?: AuditContext): Promise<JwtTokensDto> {
    this.logger.log(`Admin sign in attempt for username: ${user.username}`);
    let userFound: UserEntity;

    try {
      userFound = await this.userRepository.findOneByUsername(user.username);
    } catch (error) {
      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.SIGN_IN_FAILED, auditContext, {
            user: null,
            success: false,
            errorMessage: 'User not found',
            metadata: { username: user.username, isAdmin: true },
          }),
        );
      }
      throw error;
    }

    if (!userFound.isSuper) {
      this.logger.warn(`Admin login attempt by non-admin user: ${user.username}`);
      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.SIGN_IN_FAILED, auditContext, {
            user: userFound,
            success: false,
            errorMessage: 'User is not an admin',
            metadata: { username: user.username, isAdmin: true },
          }),
        );
      }
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }

    if (!this.userDomainService.verifyPassword(user.password, userFound.password)) {
      this.logger.warn(`Invalid password for admin username: ${user.username}`);
      if (auditContext) {
        this.auditLogService.createLog(
          AuditLogMapper.toCreateDto(AuditLogAction.SIGN_IN_FAILED, auditContext, {
            user: userFound,
            success: false,
            errorMessage: 'Invalid password',
            metadata: { username: user.username, isAdmin: true },
          }),
        );
      }
      throw new UnauthorizedException('Invalid username or password');
    }

    this.logger.log(`Successful admin sign in for user: ${user.username}`);

    const [refreshToken, expiresAt] = this.userDomainService.createRefreshToken(userFound);
    const tokenEntity = TokenMapper.toEntity(userFound, refreshToken, expiresAt);
    const token = await this.tokenRepository.create(tokenEntity);

    if (auditContext) {
      this.auditLogService.createLog(
        AuditLogMapper.toCreateDto(AuditLogAction.SIGN_IN_SUCCESS, auditContext, {
          user: userFound,
          success: true,
          metadata: { username: user.username, isAdmin: true },
        }),
      );
    }

    return this.userDomainService.createJwtTokens(token);
  }

  // Admin methods
  async findAllAdmin(page: number = 1, limit: number = 10): Promise<{ data: UserEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await this.userRepository.findAll(skip, limit);
    return { data: users, total };
  }

  async findOneAdmin(id: number): Promise<UserEntity> {
    return await this.userRepository.findOne(id);
  }

  async updateUserStatusAdmin(id: number, isActive: boolean): Promise<UserEntity> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.isActive = isActive;
    return await this.userRepository.update(id, user);
  }

  async updateUserAdmin(id: number, userData: any): Promise<UserEntity> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Update user fields
    Object.assign(user, userData);
    
    return await this.userRepository.update(id, user);
  }

  async deleteUserAdmin(id: number): Promise<void> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userRepository.delete(id);
  }
}
