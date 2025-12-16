import { OAuthDto } from "@application/dto/oauth.dto";
import { JwtTokensDto } from "@application/dto/user.dto";
import { AuditContext } from "@application/dto/audit-context.dto";


export interface IOAuthService {
	login(oauth: OAuthDto, auditContext?: AuditContext): Promise<JwtTokensDto>;
}