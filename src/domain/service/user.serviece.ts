import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "@config";
import { createHmac } from "crypto";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Token as TokenEntity } from "@domain/entities/token.entity";
import type { User as UserEntity } from "@domain/entities/user.entity";
import { JwtTokensDto } from "@application/dto/user.dto";


@Injectable()
export class DomainUserService {
	private readonly encryptionSecret: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
	) {
		const appConfig = this.configService.get<AppConfig>("app", { infer: true });
		this.encryptionSecret = appConfig?.encryption.secret ?? "your-encryption-secret";
	}


	encryptPassword(password: string): string {
		return createHmac("sha256", this.encryptionSecret).update(password).digest("hex");
	}

	verifyPassword(password: string, encryptedPassword: string): boolean {
		return this.encryptPassword(password) === encryptedPassword;
	}

	createRefreshToken(user: UserEntity): [string, Date] {
		const appConfig = this.configService.get<AppConfig>("app", { infer: true });
		const expiresIn = appConfig?.jwt.refreshExpiresIn ?? "7d";
		const token = this.jwtService.sign(
			{ sub: user.id },
			{
				secret: appConfig?.jwt.secret,
				expiresIn,
			},
		);
		const expiresAt = this.calculateTokenExpiration(expiresIn);
		return [token, expiresAt];
	}

	private calculateTokenExpiration(expiresIn: string): Date {
		const expiresInMs = this.parseExpirationToMs(expiresIn);
		return new Date(Date.now() + expiresInMs);
	}

	private parseExpirationToMs(expiresIn: string): number {
		const match = expiresIn.match(/^(\d+)([smhd])$/);
		if (!match) {
			return 7 * 24 * 60 * 60 * 1000; // Default 7 days
		}

		const value = Number.parseInt(match[1], 10);
		const unit = match[2];

		const multipliers: Record<string, number> = {
			s: 1000,
			m: 60 * 1000,
			h: 60 * 60 * 1000,
			d: 24 * 60 * 60 * 1000,
		};

		return value * (multipliers[unit] ?? 1000);
	}

	createJwtTokens(token: TokenEntity): JwtTokensDto {
		const appConfig = this.configService.get<AppConfig>("app", { infer: true });
		const accessToken = this.jwtService.sign(
			{ 
				sub: token.user.id,
				isSuper: token.user.isSuper || false,
			},
			{
				secret: appConfig?.jwt.secret,
				expiresIn: appConfig?.jwt.accessExpiresIn ?? "15m",
			},
		);
		return new JwtTokensDto(accessToken, token.token);
	}
}
