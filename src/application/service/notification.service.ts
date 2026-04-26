import { Inject, Injectable } from '@nestjs/common';
import { Notification } from '@domain/entities/notification.entity';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import type { INotificationRepository } from '@domain/interface/notification.repository';
import { INotificationService } from '@application/interface/service/notification.service';

export type CreateNotificationPayload = {
  userId: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @Inject(REPOSITORY_CONSTANTS.NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async createMany(payloads: CreateNotificationPayload[]): Promise<void> {
    if (payloads.length === 0) {
      return;
    }

    await Promise.all(payloads.map((payload) => this.notificationRepository.create(payload)));
  }

  async getUserNotifications(userId: number, limit = 20, offset = 0): Promise<Notification[]> {
    const normalizedLimit = Math.max(1, Math.min(limit, 100));
    const normalizedOffset = Math.max(0, offset);

    return this.notificationRepository.findByUserId(userId, normalizedLimit, normalizedOffset);
  }

  async markAsRead(userId: number, ids: number[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.notificationRepository.update(
      userId,
      ids,
    );
  }
}
