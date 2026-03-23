import { BaseEntity } from 'src/@shared';
import { Column, Entity } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity()
export class Payment extends BaseEntity {
  @Column({ name: 'payment_method_uuid', type: 'uuid', nullable: false })
  paymentMethodUuid: string;

  @Column({ name: 'order_uuid', type: 'uuid', nullable: false })
  orderUuid: string;

  @Column({ name: 'user_uuid', type: 'uuid', nullable: false })
  userUuid: string;

  @Column({ type: 'enum', enum: PaymentStatus, nullable: false })
  status: PaymentStatus;

  @Column({ name: 'total_price', type: 'bigint', nullable: false })
  totalPrice: number;
}
