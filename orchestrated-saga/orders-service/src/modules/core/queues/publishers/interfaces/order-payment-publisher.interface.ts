export interface OrderPaymentPayload {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
}

export abstract class OrderPaymentPublisher {
  abstract publish(payload: OrderPaymentPayload): Promise<void>;
}
