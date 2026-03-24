export interface PaymentSucceedEvent {
  orderUuid: string;
  paymentMethodUuid: string;
  userUuid: string;
  totalPrice: number;
}
