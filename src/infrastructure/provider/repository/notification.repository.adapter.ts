import { PROVIDER_CONSTANTS } from "@domain/interface/constant";
import { INotificationRepository } from "@domain/interface/notification.repository";
import { Inject } from "@nestjs/common";
import { DataSource, In, Repository } from "typeorm";
import { Notification } from "@domain/entities/notification.entity";
import { NotFoundEntityException } from "@domain/exceptions/entity.exceptions";

export class NotificationRepositoryAdapter implements INotificationRepository {
	private repository: Repository<Notification>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(Notification);
	}

	async create(notification: Notification): Promise<Notification> {
		const newNotification = this.repository.create(notification);
		return await this.repository.save(newNotification);
	}

	async findById(id: number): Promise<Notification> {
		const notification = await this.repository.findOne({ where: { id }, relations: ['user'] });
		if (!notification) {
			throw new NotFoundEntityException('Notification');
		}
		return notification;
	}

	async findByUserId(userId: number, limit?: number, offset?: number): Promise<Notification[]> {
		return await this.repository.find({ where: { userId },
			order: { createdAt: 'DESC' },
			take: limit,
			skip: offset,
		});
	}

	async findAll(): Promise<Notification[]> {
		return await this.repository.find();
	}

	async update(userId: number, ids: number[]): Promise<void> {
		await this.repository.update({ userId, id: In(ids) }, { isRead: true });
	}

	async delete(id: number): Promise<void> {
		await this.repository.delete(id);
	}
}