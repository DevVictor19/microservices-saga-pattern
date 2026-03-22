import { Order, OrderStatus } from '../../entities';

export abstract class OrderRepository {
  abstract findOneByUuid(uuid: string): Promise<Order | null>;
  abstract updateStatus(id: number, status: OrderStatus): Promise<void>;
}
