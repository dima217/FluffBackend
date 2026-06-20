import { Inject, Injectable, Logger } from '@nestjs/common';
import { IPushEventsService } from '@application/interface/service/push-events.service';
import type { IUserRepository } from '@domain/interface/user.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { NotificationService } from './notification.service';
import { FcmService } from './fcm.service';
import {
  PushNotificationContent,
  PushNotificationType,
  buildSupportTicketReplyData,
} from '@application/constants/push-notification.types';

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
    const type = data.type ?? PushNotificationType.GENERIC;

    try {
      await this.notificationService.createMany(
        userIds.map((userId) => ({
          userId,
          type,
          title,
          body,
          data: { ...data, type },
        })),
      );
    } catch (e) {
      this.logger.warn(
        `Failed to persist in-app notifications: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    if (!this.fcmService.isEnabled) {
      this.logger.warn(`FCM disabled — push not delivered to ${userIds.length} user(s)`);
      return;
    }

    const users = await this.userRepository.findByIds(userIds);
    const tokens = users.map((u) => u.fcmToken).filter((t): t is string => !!t?.trim());
    if (tokens.length === 0) {
      this.logger.warn(`No FCM tokens for user(s) ${userIds.join(', ')}`);
      return;
    }
    await this.fcmService.sendToTokens(tokens, title, body, { ...data, type });
  }

  async sendToUserIdsAll(title: string, body: string, data?: Record<string, string>): Promise<void> {
    const users = await this.userRepository.findAll();
    await this.sendToUserIds(users.map((u) => u[0].id), title, body, data ?? {});
  }

  async notifyTracking(userId: number): Promise<void> {
    await this.safe(async () => {
      const { title, body } = PushNotificationContent.trackingReminderImmediate();
      await this.sendToUserIds([userId], title, body, {
        type: PushNotificationType.TRACKING_REMINDER,
      });
    });
  }

  async notifySupportTicketReply(
    userId: number,
    ticketId: number,
    subject: string,
    messagePreview: string,
    status: string,
  ): Promise<void> {
    await this.safe(async () => {
      const { title, body } = PushNotificationContent.supportTicketReply(subject, messagePreview);
      await this.sendToUserIds(
        [userId],
        title,
        body,
        buildSupportTicketReplyData(ticketId, subject, status),
      );
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
