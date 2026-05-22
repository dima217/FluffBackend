import { SupportMessage } from '@domain/entities/support-message.entity';

export interface ISupportMessageRepository {
  create(message: Partial<SupportMessage>): Promise<SupportMessage>;
  findByTicket(ticketId: number, limit?: number, beforeId?: number): Promise<SupportMessage[]>;
  findOne(id: number): Promise<SupportMessage>;
  update(id: number, data: Partial<SupportMessage>): Promise<SupportMessage>;
  delete(id: number): Promise<void>;
}
