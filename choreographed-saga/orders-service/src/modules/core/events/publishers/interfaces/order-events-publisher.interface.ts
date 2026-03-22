import { StartOrderPaymentEvent } from '../../start-order-payment.event';

export abstract class OrderEventsPublisher {
  abstract emitStartOrderPaymentEvent(
    event: StartOrderPaymentEvent,
  ): Promise<void>;
}
