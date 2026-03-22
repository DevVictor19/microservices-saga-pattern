import { OrderItem } from '../value-objects';

export interface ItemReservationFailedEvent {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  failedItems: OrderItem[];
}
