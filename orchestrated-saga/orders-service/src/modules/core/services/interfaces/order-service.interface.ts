export type ReserveItemsResult =
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
  result: ReserveItemsResult;
}

export abstract class OrderService {
  abstract prepareOrderForPayment(
    orderUuid: string,
    paymentMethodUuid: string,
  ): Promise<void>;

  abstract processReservationResult(
    input: ProcessReservationResultInput,
  ): Promise<void>;
}
