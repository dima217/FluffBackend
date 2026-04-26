import { Notification } from "@domain/entities/notification.entity";
import { CreateNotificationPayload } from "@application/interface/service/notification.service";

export interface INotificationRepository {
	create(notification: CreateNotificationPayload): Promise<Notification>;
	findById(id: number): Promise<Notification>;
	findByUserId(userId: number, limit?: number, offset?: number): Promise<Notification[]>;
	findAll(): Promise<Notification[]>;
	update(userId: number, ids: number[]): Promise<void>;
	delete(id: number): Promise<void>;
}