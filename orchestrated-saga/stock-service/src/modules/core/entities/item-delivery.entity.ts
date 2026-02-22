import { BaseEntity } from 'src/@shared';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Item } from './item.entity';

@Entity()
export class ItemDelivery extends BaseEntity {
  @Column({ name: 'item_id', type: 'int', nullable: false })
  itemId: number;

  @ManyToOne(() => Item, { nullable: false })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'user_uuid', type: 'uuid', nullable: false })
  userUuid: string;

  @Column({ name: 'order_uuid', type: 'uuid', nullable: false })
  orderUuid: string;

  @Column({ name: 'payment_uuid', type: 'uuid', nullable: false })
  paymentUuid: string;

  @Column({ name: 'delivery_forecast', type: 'timestamp', nullable: false })
  deliveryForecast: Date;
}
