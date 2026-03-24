import { BaseEntity } from 'src/@shared';
import { Column, Entity } from 'typeorm';

@Entity()
export class LoyaltyPoint extends BaseEntity {
  @Column({ name: 'order_uuid', type: 'uuid', nullable: false })
  orderUuid: string;

  @Column({ name: 'user_uuid', type: 'uuid', nullable: false })
  userUuid: string;

  @Column({
    name: 'points',
    type: 'bigint',
    nullable: false,
  })
  points: number;
}
