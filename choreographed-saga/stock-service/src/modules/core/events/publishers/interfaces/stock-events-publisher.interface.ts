import { ItemReservationFailedEvent } from '../../item-reservation-failed.event';
import { ItemReservationSucceedEvent } from '../../item-reservation-succeed.event';

export abstract class StockEventsPublisher {
  abstract emitItemReservationSucceedEvent(
    event: ItemReservationSucceedEvent,
  ): Promise<void>;
  abstract emitItemReservationFailedEvent(
    event: ItemReservationFailedEvent,
  ): Promise<void>;
}
