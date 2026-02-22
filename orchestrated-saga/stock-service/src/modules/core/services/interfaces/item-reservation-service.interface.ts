import { OrderItem } from '../../value-objects';

export interface ReserveItemsInput {
  userUuid: string;
  orderUuid: string;
  items: OrderItem[];
}

export abstract class ItemReservationService {
  abstract reserveItems(input: ReserveItemsInput): Promise<void>;
}
