export interface ItemReservationFailedEvent {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  failedItems: Array<{
    itemUuid: string;
    quantity: number;
  }>;
}
