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
}
