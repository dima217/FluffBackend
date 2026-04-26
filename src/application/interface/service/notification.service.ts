import { Inject, Injectable } from '@nestjs/common';
import { Notification } from '@domain/entities';

export type CreateNotificationPayload = {
  userId: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

export interface INotificationService {
    createMany(payloads: CreateNotificationPayload[]): Promise<void>
    getUserNotifications(userId: number, limit: number, offset: number): Promise<Notification[]>
    markAsRead(userId: number, ids: number[]): Promise<void> 
}