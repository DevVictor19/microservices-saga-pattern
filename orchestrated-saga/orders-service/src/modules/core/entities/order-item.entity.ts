import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/@shared';
import { Order } from './order.entity';

@Entity()
export class OrderItem extends BaseEntity {
  @Column({ name: 'order_id', type: 'int', nullable: false })
  orderId: number;

  @ManyToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'item_uuid', type: 'uuid', nullable: false })
  itemUuid: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'bigint', nullable: false })
  price: number;

  @Column({ name: 'quantity', type: 'int', nullable: false })
  quantity: number;
}
