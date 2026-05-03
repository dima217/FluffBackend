import { SupportTicket } from "@domain/entities/support-ticket.entity";
import { PaginationOptions } from "./product.repository";

export interface ISupportRepository {
  create(supportTicket: Partial<SupportTicket>): Promise<SupportTicket>;
  findAll(options?: PaginationOptions): Promise<{data: SupportTicket[], total: number}>;
  findAllByUserId(userId: number, options?: PaginationOptions): Promise<{data: SupportTicket[], total: number}>;
  findOne(id: number, userId?: number): Promise<SupportTicket>;
  update(id: number, supportTicket: Partial<SupportTicket>): Promise<SupportTicket>;
  delete(id: number): Promise<void>;
}