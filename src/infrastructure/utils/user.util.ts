import { JwtTokensDto } from "@application/dto/user.dto";
import { JwtResponse } from "@infrastructure/dto/jwt.dto";
import { HttpStatus } from "@nestjs/common";
import { Response, Request } from 'express';


export class UserUtils {
	static setJwtTokensResponse(jwtTokens: JwtTokensDto, response: Response): Response<JwtResponse> {
		response.cookie('refreshToken', jwtTokens.refresh, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 1000 * 60 * 60 * 24 * 90,
		});

		const body = new JwtResponse(jwtTokens.access);
		response.status(HttpStatus.OK).json(body);
		return response;
	}

	static getRefreshTokenFromRequest(request: Request): string | null {
		return request?.cookies?.refreshToken || null;
	}
}