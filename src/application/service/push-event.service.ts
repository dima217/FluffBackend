import { Inject, Injectable, Logger } from '@nestjs/common';
import { IPushEventsService } from '@application/interface/service/push-events.service';
import type { IUserRepository } from '@domain/interface/user.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { NotificationService } from './notification.service';
import { FcmService } from './fcm.service';

const dataStr = (v: string | undefined) => (v === undefined ? '' : String(v));

@Injectable()
export class PushEventsService implements IPushEventsService {
  private readonly logger = new Logger(PushEventsService.name);

  constructor(
    private readonly fcmService: FcmService,
    @Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly notificationService: NotificationService, 
   
  ) {}

  async sendToUserIds(
    userIds: number[],
    title: string,
    body: string,
    data: Record<string, string>,
  ): Promise<void> {
    if (userIds.length === 0) return;
    const type = data.type ?? 'generic';
    await this.notificationService.createMany(
      userIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        data,
      })),
    );

    if (!this.fcmService.isEnabled) return;
    const users = await this.userRepository.findByIds(userIds);
    const tokens = users.map((u) => u.fcmToken).filter((t): t is string => !!t?.trim());
    if (tokens.length === 0) return;
    await this.fcmService.sendToTokens(tokens, title, body, data);
  }
  async sendToUserIdsAll(title: string, body: string, data?: Record<string, string>): Promise<void> {
    const users = await this.userRepository.findAll();
    await this.sendToUserIds(users.map((u) => u[0].id), title, body, data ?? {} );
  }

  async notifyTracking(userId: number): Promise<void> {
    this.sendToUserIds([userId], "Not enough calories today", "At this rate, you yourself will become like my stem. Have another meal!", {
        type: 'tracking_reminder',
    });
  } 

  private async safe(run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (e) {
      this.logger.warn(`Push event failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
