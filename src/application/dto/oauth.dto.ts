import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";


export class OAuthDto {
	static Type = {
		GOOGLE: "GOOGLE",
	} as const; 

	@ApiProperty({ example: 'oauth_token_here', description: 'OAuth token' })
	@IsNotEmpty()
	@IsString()
	token: string;

	@ApiProperty({ example: 'GOOGLE', description: 'OAuth type', enum: OAuthDto.Type })
	@IsNotEmpty()
	@IsEnum(OAuthDto.Type)
	type: OAuthType;
}

export type OAuthType = typeof OAuthDto.Type[keyof typeof OAuthDto.Type];