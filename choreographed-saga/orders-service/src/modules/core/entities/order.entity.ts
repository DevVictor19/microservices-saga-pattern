import { BaseEntity } from 'src/@shared';
import { Column, Entity, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  WAITING_PAYMENT = 'waiting_payment',
  RESERVING_ITEMS = 'reserving_items',
  UNAVAILABLE_ITEMS = 'unavailable_items',
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
}

@Entity()
export class Order extends BaseEntity {
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    eager: true,
  })
  orderItems: OrderItem[];

  @Column({ name: 'user_uuid', type: 'uuid', nullable: false })
  userUuid: string;

  @Column({ name: 'status', type: 'enum', enum: OrderStatus, nullable: false })
  status: OrderStatus;

  @Column({ name: 'total_price', type: 'bigint', nullable: false })
  totalPrice: number;
}
