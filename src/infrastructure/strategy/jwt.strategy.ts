import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { IUserRepository } from '@domain/interface/user.repository';
import type { AppConfig } from '@config';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService<AppConfig>,
    @Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
    private userRepository: IUserRepository,
  ) {
    const appConfig = configService.get<AppConfig>('app', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig?.jwt.secret ?? 'your-secret-key',
    });
  }

  async validate(payload?: { sub?: number; isSuper?: boolean }) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.userRepository.findOne(payload.sub);

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Сохраняем payload с isSuper для использования в guards
    return {
      ...user,
      payload: {
        sub: payload.sub,
        isSuper: payload.isSuper || user.isSuper,
      },
    };
  }
}
