import { BaseEntity } from 'src/@shared';
import { Column, Entity } from 'typeorm';

@Entity()
export class Item extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'bigint', nullable: false })
  price: number;

  @Column({ name: 'quantity_in_stock', type: 'int', nullable: false })
  quantityInStock: number;
}
