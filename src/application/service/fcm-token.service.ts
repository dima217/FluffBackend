import { Inject, Injectable } from '@nestjs/common';
import { IFcmTokenService } from '@application/interface/service/fcm-token.service';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import type { IUserRepository } from '@domain/interface/user.repository';

/**
 * Persistence and lifecycle of FCM device tokens (separate from {@link FcmService} which sends messages).
 */
@Injectable()
export class FcmTokenService implements IFcmTokenService {
  constructor(
    @Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  /** Save or replace the device token; pass `null` or clear via {@link clearToken} to unregister pushes. */
  async saveFcmToken(userId: number, token: string | null): Promise<void> {
    if (!token) {
      await this.userRepository.update(userId, { fcmToken: null });
      return;
    }
    await this.userRepository.clearTokenFromOtherUsers(userId, token);
  
    await this.userRepository.update(userId, { fcmToken: token });
  }

  async clearFcmTokens(userId: number): Promise<void> {
    await this.saveFcmToken(userId, null);
  }
}
