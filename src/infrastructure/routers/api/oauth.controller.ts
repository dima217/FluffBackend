import { Body, Controller, Post, Req, Res, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { OAuthService } from "@application/service/oauth/oauth.service";
import { OAuthDto } from "@application/dto/oauth.dto";
import { JwtTokensDto } from "@application/dto/user.dto";
import { UserUtils } from "@infrastructure/utils/user.util";
import { AuditContextMapper } from "@application/mapper";
import { Public } from "@infrastructure/decorator/public.decorator";
import type { Response, Request } from "express";

@ApiTags('OAuth Authentication')
@Public()
@Controller('oauth')
export class OAuthController {
	constructor(private readonly oauthService: OAuthService) { }

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'OAuth login', description: 'Authenticate user using OAuth provider (Google, etc.) and get JWT tokens' })
	@ApiBody({ type: OAuthDto })
	@ApiResponse({ status: 200, description: 'OAuth login successful', type: JwtTokensDto })
	@ApiResponse({ status: 401, description: 'Invalid OAuth token' })
	@ApiResponse({ status: 403, description: 'OAuth type not supported' })
	async login(@Body() oauthDto: OAuthDto, @Req() request: Request, @Res() response: Response) {
		const auditContext = AuditContextMapper.fromRequest(request);
		const jwtTokens = await this.oauthService.login(oauthDto, auditContext);
		UserUtils.setJwtTokensResponse(jwtTokens, response);
		return response;
	}
}

