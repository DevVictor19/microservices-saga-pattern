export abstract class ItemDeliveryRepository {
  abstract createDelivery(userUuid: string, orderUuid: string): Promise<void>;
}
