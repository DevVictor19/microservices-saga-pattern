import { PaymentFailedEvent } from '../../payment-failed.event';
import { PaymentSucceedEvent } from '../../payment-succeed.event';

export abstract class PaymentEventsPublisher {
  abstract emitPaymentSucceedEvent(event: PaymentSucceedEvent): Promise<void>;
  abstract emitPaymentFailedEvent(event: PaymentFailedEvent): Promise<void>;
}
