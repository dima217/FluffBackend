import { OAuthDto, OAuthType } from "@application/dto/oauth.dto";
import { JwtTokensDto } from "@application/dto/user.dto";
import { User } from "@domain/entities/user.entity";
import { ForbiddenException } from "@nestjs/common";
import { AuditContext } from "@application/dto/audit-context.dto";


export abstract class OAuthStrategy {
	public abstract readonly type: OAuthType;

	/**
	 * Login with the OAuth strategy
	 * @param oauthData - The OAuth data
	 * @param auditContext - The audit context for logging
	 * @returns The JWT tokens
	 */
	abstract execute(oauthData: OAuthDto, auditContext?: AuditContext): Promise<JwtTokensDto>;

	/**
	 * Registration is not supported for this strategy
	 * @param oauthData - The OAuth data
	 * @returns The user
	 * @throws ForbiddenException
	 */
	async registration(oauthData: OAuthDto): Promise<User> {
		throw new ForbiddenException(`Registration is not supported for ${this.type}`)
	}
}