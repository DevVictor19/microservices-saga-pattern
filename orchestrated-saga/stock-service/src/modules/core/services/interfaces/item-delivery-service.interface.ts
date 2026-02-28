export interface SendToDeliverInput {
  userUuid: string;
  orderUuid: string;
}

export abstract class ItemDeliveryService {
  abstract sendToDeliver(input: SendToDeliverInput): Promise<void>;
}
