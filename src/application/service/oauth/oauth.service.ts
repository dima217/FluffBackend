import { OAuthStrategyFactory } from "./strategy.factory";
import { IOAuthService } from "@application/interface/service/oauth.service";
import { Injectable, Logger } from "@nestjs/common";
import { OAuthDto } from "@application/dto/oauth.dto";
import { JwtTokensDto } from "@application/dto/user.dto";
import { AuditContext } from "@application/dto/audit-context.dto";


@Injectable()
export class OAuthService implements IOAuthService {
	private readonly logger = new Logger(OAuthService.name);
	constructor(private readonly strategyFactory: OAuthStrategyFactory) { }

	async login(oauth: OAuthDto, auditContext?: AuditContext): Promise<JwtTokensDto> {
		this.logger.log(`Login attempt for OAuth type: ${oauth.type}`);
		const strategy = this.strategyFactory.getStrategy(oauth.type);
		try {
			return await strategy.execute(oauth, auditContext);
		} catch (error) {
			this.logger.error(`Error logging in with OAuth type: ${oauth.type}`, error);
			throw error;
		}
	}
}