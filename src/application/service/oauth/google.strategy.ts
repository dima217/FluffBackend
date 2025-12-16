import { OAuthDto } from "@application/dto/oauth.dto";
import { JwtTokensDto } from "@application/dto/user.dto";
import { OAuthStrategy } from "@application/interface/oauth.strategy";
import { Injectable, Inject, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import type { IUserRepository } from "@domain/interface/user.repository";
import type { IProfileRepository } from "@domain/interface/profile.repository";
import type { ITokenRepository } from "@domain/interface/token.repository";
import { DomainUserService } from "@domain/service/user.serviece";
import { UserMapper, ProfileMapper, TokenMapper, AuditLogMapper } from "@application/mapper";
import { User as UserEntity } from "@domain/entities/user.entity";
import { NotificationRegistrationObservable } from "@application/service/observable/notification.service";
import { AuditLogService } from "@application/service/audit-log.service";
import { AuditLogAction } from "@domain/entities/audit-log.entity";
import { AuditContext } from "@application/dto/audit-context.dto";
import { randomBytes } from "crypto";
import type { AppConfig } from "@config";
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class GoogleStrategy extends OAuthStrategy {
	readonly type = OAuthDto.Type.GOOGLE;
	private readonly logger = new Logger(GoogleStrategy.name);
	private readonly googleClient: OAuth2Client;
	private readonly googleClientId: string;

	constructor(
		@Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
		private readonly userRepository: IUserRepository,

		@Inject(REPOSITORY_CONSTANTS.PROFILE_REPOSITORY)
		private readonly profileRepository: IProfileRepository,

		@Inject(REPOSITORY_CONSTANTS.TOKEN_REPOSITORY)
		private readonly tokenRepository: ITokenRepository,

		private readonly userDomainService: DomainUserService,

		private readonly notificationRegistrationObservable: NotificationRegistrationObservable,

		private readonly auditLogService: AuditLogService,

		private readonly configService: ConfigService<AppConfig>,
	) {
		super();
		const appConfig = this.configService.get<AppConfig>('app', { infer: true });
		this.googleClientId = appConfig?.oauth?.google?.clientId ?? '';
		// Initialize Google OAuth2Client
		this.googleClient = new OAuth2Client();
	}

	async execute(oauthData: OAuthDto, auditContext?: AuditContext): Promise<JwtTokensDto> {
		this.logger.log(`Google OAuth login attempt with token`);

		try {
			// Verify Google token and get user information
			const ticket = await this.googleClient.verifyIdToken({
				idToken: oauthData.token,
				audience: this.googleClientId || undefined, // Optional: verify audience
			});

			const payload = ticket.getPayload();
			if (!payload) {
				// Log failed OAuth login attempt
				if (auditContext) {
					this.auditLogService.createLog(
						AuditLogMapper.toCreateDto(AuditLogAction.OAUTH_LOGIN_FAILED, auditContext, {
							user: null,
							success: false,
							errorMessage: 'Invalid Google token - no payload',
							metadata: { type: oauthData.type },
						}),
					);
				}
				throw new UnauthorizedException('Invalid Google token');
			}

			const email = payload.email;

			if (!email) {
				// Log failed OAuth login attempt
				if (auditContext) {
					this.auditLogService.createLog(
						AuditLogMapper.toCreateDto(AuditLogAction.OAUTH_LOGIN_FAILED, auditContext, {
							user: null,
							success: false,
							errorMessage: 'Email not provided by Google',
							metadata: { type: oauthData.type },
						}),
					);
				}
				throw new UnauthorizedException('Email not provided by Google');
			}

			this.logger.log(`Google token verified for email: ${email}`);

			// Check if user exists by email
			const userFound = await this.userRepository.findEmailOrPhone(email);

			if (userFound) {
				// User exists - authenticate like signIn
				this.logger.log(`User found, authenticating: ${email}`);
				const tokens = await this.authenticateExistingUser(userFound);

				// Log successful OAuth login
				if (auditContext) {
					this.auditLogService.createLog(
						AuditLogMapper.toCreateDto(AuditLogAction.OAUTH_LOGIN_SUCCESS, auditContext, {
							user: userFound,
							success: true,
							metadata: { email, type: oauthData.type },
						}),
					);
				}

				return tokens;
			} else {
				// User doesn't exist - register user using registration method
				this.logger.log(`User not found, registering new user from Google data: ${email}`);
				const oauthDataForRegistration: OAuthDto = {
					token: oauthData.token,
					type: oauthData.type,
				};
				const newUser = await this.registration(oauthDataForRegistration, auditContext);
				const tokens = await this.authenticateExistingUser(newUser);
				return tokens;
			}
		} catch (error) {
			this.logger.error(`Google OAuth error: ${error instanceof Error ? error.message : String(error)}`);

			// Log failed OAuth login attempt if not already logged
			if (auditContext && !(error instanceof UnauthorizedException)) {
				this.auditLogService.createLog(
					AuditLogMapper.toCreateDto(AuditLogAction.OAUTH_LOGIN_FAILED, auditContext, {
						user: null,
						success: false,
						errorMessage: error instanceof Error ? error.message : String(error),
						metadata: { type: oauthData.type },
					}),
				);
			}

			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw new UnauthorizedException('Failed to verify Google token');
		}
	}

	private async authenticateExistingUser(user: UserEntity): Promise<JwtTokensDto> {
		// Create refresh token
		const [refreshToken, expiresAt] = this.userDomainService.createRefreshToken(user);
		const tokenEntity = TokenMapper.toEntity(user, refreshToken, expiresAt);
		const token = await this.tokenRepository.create(tokenEntity);

		// Return JWT tokens
		return this.userDomainService.createJwtTokens(token);
	}

	async registration(oauthData: OAuthDto, auditContext?: AuditContext): Promise<UserEntity> {
		this.logger.log(`Google OAuth registration for token`);

		try {
			// Verify Google token and get user information
			const ticket = await this.googleClient.verifyIdToken({
				idToken: oauthData.token,
				audience: this.googleClientId || undefined,
			});

			const payload = ticket.getPayload();
			if (!payload) {
				// Log failed OAuth registration
				if (auditContext) {
					this.auditLogService.createLog(
						AuditLogMapper.toCreateDto(AuditLogAction.OAUTH_REGISTRATION_FAILED, auditContext, {
							user: null,
							success: false,
							errorMessage: 'Invalid Google token - no payload',
							metadata: { type: oauthData.type },
						}),
					);
				}
				throw new UnauthorizedException('Invalid Google token');
			}

			const email = payload.email;
			const firstName = payload.given_name || '';
			const lastName = payload.family_name || '';
			const photo = payload.picture || '';

			if (!email) {
				// Log failed OAuth registration
				if (auditContext) {
					this.auditLogService.createLog(
						AuditLogMapper.toCreateDto(AuditLogAction.OAUTH_REGISTRATION_FAILED, auditContext, {
							user: null,
							success: false,
							errorMessage: 'Email not provided by Google',
							metadata: { type: oauthData.type },
						}),
					);
				}
				throw new UnauthorizedException('Email not provided by Google');
			}

			this.logger.log(`Registering new user from Google: ${email}`);

			// Generate a random password for OAuth users (they won't use it)
			const randomPassword = randomBytes(32).toString('hex');
			const encryptedPassword = this.userDomainService.encryptPassword(randomPassword);

			// Create user entity
			const userEntity = UserMapper.toEntityFromGoogle(email, firstName, lastName, encryptedPassword);
			const userSaved = await this.userRepository.create(userEntity);

			// Create profile with photo and optional birthDate
			// Note: birthDate is not available in standard Google ID token
			// To get it, you need to request 'user.birthday.read' scope and use People API
			const profileData = {
				photo: photo || '',
				birthDate: undefined, // Can be set if obtained from People API
			};
			const profileEntity = ProfileMapper.toEntity(userSaved, profileData);
			await this.profileRepository.create(userSaved.id, profileEntity);

			this.logger.log(`User successfully registered from Google: ${email} (ID: ${userSaved.id})`);

			// Log successful OAuth registration
			if (auditContext) {
				this.auditLogService.createLog(
					AuditLogMapper.toCreateDto(AuditLogAction.OAUTH_REGISTRATION_SUCCESS, auditContext, {
						user: userSaved,
						success: true,
						metadata: { email, type: oauthData.type },
					}),
				);
			}

			// Send welcome notification
			this.notificationRegistrationObservable.accept(userSaved).catch((error) => {
				this.logger.error(`Failed to send registration notification: ${error instanceof Error ? error.message : String(error)}`);
			});

			return userSaved;
		} catch (error) {
			this.logger.error(`Google OAuth registration error: ${error instanceof Error ? error.message : String(error)}`);

			// Log failed OAuth registration if not already logged
			if (auditContext && !(error instanceof UnauthorizedException)) {
				this.auditLogService.createLog(
					AuditLogMapper.toCreateDto(AuditLogAction.OAUTH_REGISTRATION_FAILED, auditContext, {
						user: null,
						success: false,
						errorMessage: error instanceof Error ? error.message : String(error),
						metadata: { type: oauthData.type },
					}),
				);
			}

			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw new UnauthorizedException('Failed to register user from Google token');
		}
	}
}