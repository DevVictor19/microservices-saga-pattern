import { OrderItem } from 'src/modules/core/value-objects';

export type ReserveItemsResult =
  | {
      success: true;
      reservationUuids: string[];
    }
  | {
      success: false;
      failedItems: OrderItem[];
    };

export interface OrderItemsReservationResultPayload {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  result: ReserveItemsResult;
}

export abstract class OrderItemsReservationResultPublisher {
  abstract publish(payload: OrderItemsReservationResultPayload): Promise<void>;
}
