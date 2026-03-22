export interface StartOrderPaymentEvent {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  items: Array<{
    itemUuid: string;
    quantity: number;
  }>;
}
