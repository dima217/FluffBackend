import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { User as UserEntity } from '@domain/entities/user.entity';

@Injectable()
export class IsSuperGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: UserEntity & { payload?: { isSuper?: boolean } } = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const isSuper = user?.payload?.isSuper ?? user?.isSuper ?? false;

    if (!isSuper) {
      throw new ForbiddenException('Access denied. Super admin privileges required.');
    }

    return true;
  }
}
