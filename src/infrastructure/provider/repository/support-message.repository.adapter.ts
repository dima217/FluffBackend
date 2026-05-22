import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SupportMessage } from '@domain/entities/support-message.entity';
import { ISupportMessageRepository } from '@domain/interface/support-message.repository';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';
import { NotFoundEntityException } from '@domain/exceptions/entity.exceptions';

@Injectable()
export class SupportMessageRepositoryAdapter implements ISupportMessageRepository {
  private repository: Repository<SupportMessage>;

  constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(SupportMessage);
  }

  async create(message: Partial<SupportMessage>): Promise<SupportMessage> {
    const newMessage = this.repository.create(message);
    return await this.repository.save(newMessage);
  }

  async findByTicket(ticketId: number, limit = 50, beforeId?: number): Promise<SupportMessage[]> {
    const qb = this.repository
      .createQueryBuilder('m')
      .where('m.ticketId = :ticketId', { ticketId })
      .orderBy('m.createdAt', 'ASC')
      .take(limit);

    if (beforeId) {
      const ref = await this.repository.findOne({ where: { id: beforeId } });
      if (ref) {
        qb.andWhere('m.createdAt < :before', { before: ref.createdAt });
      }
    }

    return await qb.getMany();
  }

  async findOne(id: number): Promise<SupportMessage> {
    const msg = await this.repository.findOne({ where: { id } });
    if (!msg) {
      throw new NotFoundEntityException('Support message');
    }
    return msg;
  }

  async update(id: number, data: Partial<SupportMessage>): Promise<SupportMessage> {
    await this.repository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
