export interface OrderItemsReservationPayload {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  items: Array<{
    itemUuid: string;
    quantity: number;
  }>;
}

export abstract class OrderItemsReservationPublisher {
  abstract publish(payload: OrderItemsReservationPayload): Promise<void>;
}
