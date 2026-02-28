export interface ReceiveLoyaltyPointsPayload {
  userUuid: string;
  orderUuid: string;
  totalPrice: number;
}

export abstract class OrderReceiveLoyaltyPointsPublisher {
  abstract publish(payload: ReceiveLoyaltyPointsPayload): Promise<void>;
}
