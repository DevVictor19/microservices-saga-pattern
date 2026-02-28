export interface SendToDeliverPayload {
  userUuid: string;
  orderUuid: string;
}

export abstract class OrderSendToDeliverPublisher {
  abstract publish(payload: SendToDeliverPayload): Promise<void>;
}
