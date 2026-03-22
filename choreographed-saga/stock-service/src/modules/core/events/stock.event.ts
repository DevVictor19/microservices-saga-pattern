import { ItemReservationFailedEvent } from './item-reservation-failed.event';
import { ItemReservationSucceedEvent } from './item-reservation-succeed.event';

export enum StockEventType {
  RESERVATION_SUCCEED = 'RESERVATION_SUCCEED',
  RESERVATION_FAILED = 'RESERVATION_FAILED',
}

export type StockEvent =
  | {
      type: StockEventType.RESERVATION_SUCCEED;
      payload: ItemReservationSucceedEvent;
    }
  | {
      type: StockEventType.RESERVATION_FAILED;
      payload: ItemReservationFailedEvent;
    };
