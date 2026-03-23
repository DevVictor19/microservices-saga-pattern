export interface PaymentFailedEvent {
  orderUuid: string;
  paymentMethodUuid: string;
  userUuid: string;
  totalPrice: number;
  reason?: string;
}
