import { JwtTokensDto, UserOauthDto } from '@application/dto/user.dto';

export interface IUserOauthService {
  googleLogin(user: UserOauthDto): Promise<JwtTokensDto>;
}
