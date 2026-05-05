import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@domain/entities/user.entity';

export enum SupportTicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('support_tickets')
export class SupportTicket {
  @ApiProperty({ description: 'Unique ticket identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID who created the ticket' })
  @Column('int')
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'Ticket subject', example: 'Проблема с заказом #12345' })
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @ApiProperty({
    description: 'Ticket message/description',
    example: 'Мой заказ не был доставлен в указанное время',
  })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    description: 'Ticket status',
    enum: SupportTicketStatus,
    example: SupportTicketStatus.OPEN,
    default: SupportTicketStatus.OPEN,
  })
  @Column({
    type: 'enum',
    enum: SupportTicketStatus,
    default: SupportTicketStatus.OPEN,
  })
  status: SupportTicketStatus;

  @ApiProperty({
    description: 'Admin response to the ticket',
    nullable: true,
    example: 'Спасибо за обращение. Мы проверим ваш заказ и свяжемся с вами.',
  })
  @Column({ type: 'text', nullable: true, default: null })
  adminResponse: string | null;

  @ApiProperty({ description: 'Date when ticket was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date when ticket was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    description: 'Скриншот к обращению',
  })
  @Column({ type: 'text', nullable: true })
  screenshot: string | null;
}
