import { Token } from '@domain/entities/token.entity';
import type { User } from '@domain/entities/user.entity';

export class TokenMapper {
	static toEntity(user: User, refreshToken: string, expiresAt: Date): Token {
		return {
			user,
			token: refreshToken,
			expiresAt,
			createdAt: new Date(),
		} as Token;
	}
}

