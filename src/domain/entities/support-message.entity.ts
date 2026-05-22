import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';

export type MessageSenderType = 'user' | 'admin';

export type SupportMessageAttachmentType = 'image' | 'file';

export interface SupportMessageAttachment {
  url: string;
  type?: SupportMessageAttachmentType;
  name?: string;
}

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  ticketId: number;

  @ManyToOne(() => SupportTicket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @Column('int')
  senderId: number;

  @Column({ type: 'varchar', length: 10, default: 'user' })
  senderType: MessageSenderType;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column('jsonb', { default: () => "'[]'" })
  attachments: SupportMessageAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  editedAt: Date | null;
}
