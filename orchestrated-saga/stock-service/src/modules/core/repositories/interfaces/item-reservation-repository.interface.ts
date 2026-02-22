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
  abstract reserveItems(input: ReserveItemsInput): Promise<ReserveItemsOutput>;
}
