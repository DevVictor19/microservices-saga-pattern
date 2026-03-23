export interface ItemReservationSucceedEvent {
  userUuid: string;
  orderUuid: string;
  totalPrice: number;
  paymentMethodUuid: string;
  reservationUuids: string[];
}
