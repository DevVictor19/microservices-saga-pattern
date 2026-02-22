import { BaseEntity } from 'src/@shared';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Item } from './item.entity';

@Entity()
export class ItemReservation extends BaseEntity {
  @JoinColumn({ name: 'item_id' })
  itemId: number;

  @ManyToOne(() => Item, { nullable: false })
  item: Item;

  @Column({ name: 'user_uuid', type: 'uuid', nullable: false })
  userUuid: string;

  @Column({ name: 'order_uuid', type: 'uuid', nullable: false })
  orderUuid: string;

  @Column({ type: 'int', nullable: false })
  quantity: number;
}
