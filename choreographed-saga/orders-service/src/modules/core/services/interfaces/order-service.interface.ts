export interface ProcessReservationSucceedInput {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  reservationUuids: string[];
}

export interface ProcessReservationFailedInput {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  failedItems: Array<{
    itemUuid: string;
    quantity: number;
  }>;
}

export interface ProcessPaymentFailedInput {
  orderUuid: string;
  paymentMethodUuid: string;
  userUuid: string;
  totalPrice: number;
}

export interface ProcessPaymentSucceedInput {
  orderUuid: string;
  paymentMethodUuid: string;
  userUuid: string;
  totalPrice: number;
  reason?: string;
}

export abstract class OrderService {
  abstract startOrderPayment(
    orderUuid: string,
    paymentMethodUuid: string,
  ): Promise<void>;

  abstract processReservationSucceed(
    input: ProcessReservationSucceedInput,
  ): Promise<void>;

  abstract processReservationFailed(
    input: ProcessReservationFailedInput,
  ): Promise<void>;

  abstract processPaymentFailed(
    input: ProcessPaymentFailedInput,
  ): Promise<void>;

  abstract processPaymentSucceed(
    input: ProcessPaymentSucceedInput,
  ): Promise<void>;
}
