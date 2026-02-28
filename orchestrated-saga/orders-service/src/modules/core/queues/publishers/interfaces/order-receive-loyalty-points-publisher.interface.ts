export interface ReceiveLoyaltyPointsPayload {
  userUuid: string;
  orderUuid: string;
}

export abstract class OrderReceiveLoyaltyPointsPublisher {
  abstract publish(payload: ReceiveLoyaltyPointsPayload): Promise<void>;
}
