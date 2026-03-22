import { OrderItem } from '../../value-objects';

export interface ReserveItemsInput {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  items: OrderItem[];
}

export interface UndoReservationInput {
  userUuid: string;
  orderUuid: string;
}

export abstract class ItemReservationService {
  abstract reserveItems(input: ReserveItemsInput): Promise<void>;
  abstract undoReservation(input: UndoReservationInput): Promise<void>;
}
