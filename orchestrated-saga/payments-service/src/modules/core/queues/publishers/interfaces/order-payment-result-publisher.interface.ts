export interface OrderPaymentResultPayload {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  success: boolean;
  reason?: string;
}

export abstract class OrderPaymentResultPublisher {
  abstract publish(payload: OrderPaymentResultPayload): Promise<void>;
}
