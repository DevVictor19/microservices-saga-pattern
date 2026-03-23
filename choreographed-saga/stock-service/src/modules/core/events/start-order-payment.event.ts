export interface StartOrderPaymentEvent {
  userUuid: string;
  orderUuid: string;
  totalPrice: number;
  paymentMethodUuid: string;
  items: Array<{
    itemUuid: string;
    quantity: number;
  }>;
}
