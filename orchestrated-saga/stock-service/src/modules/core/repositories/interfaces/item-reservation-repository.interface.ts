import { ItemReservation } from '../../entities';
import { OrderItem } from '../../value-objects';

export interface ReserveItemsInput {
  userUuid: string;
  orderUuid: string;
  items: OrderItem[];
}

export type ReserveItemsOutput =
  | {
      success: true;
      reservationUuids: string[];
    }
  | {
      success: false;
      failedItems: OrderItem[];
    };

export abstract class ItemReservationRepository {
  abstract undoReservation(orderUuid: string): Promise<void>;
  abstract reserveItems(input: ReserveItemsInput): Promise<ReserveItemsOutput>;
  abstract findManyByOrderUuid(orderUuid: string): Promise<ItemReservation[]>;
}
