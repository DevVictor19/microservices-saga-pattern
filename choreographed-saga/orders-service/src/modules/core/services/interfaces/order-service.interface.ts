export type ItemsReservationResult =
  | {
      success: true;
      reservationUuids: string[];
    }
  | {
      success: false;
      failedItems: Array<{
        itemUuid: string;
        quantity: number;
      }>;
    };

export interface ProcessReservationResultInput {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  result: ItemsReservationResult;
}

export interface ProcessPaymentResultInput {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  success: boolean;
  reason?: string;
}

export abstract class OrderService {
  abstract startOrderPayment(
    orderUuid: string,
    paymentMethodUuid: string,
  ): Promise<void>;
}
