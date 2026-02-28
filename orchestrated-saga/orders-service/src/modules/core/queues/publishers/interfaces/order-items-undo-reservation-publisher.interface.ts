export interface UndoReservationPayload {
  userUuid: string;
  orderUuid: string;
}

export abstract class OrderItemsUndoReservationPublisher {
  abstract publish(payload: UndoReservationPayload): Promise<void>;
}
