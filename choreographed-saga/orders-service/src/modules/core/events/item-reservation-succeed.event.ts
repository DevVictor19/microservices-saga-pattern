export interface ItemReservationSucceedEvent {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  reservationUuids: string[];
}
