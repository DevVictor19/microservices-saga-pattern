import { PaymentFailedEvent } from './payment-failed.event';
import { PaymentSucceedEvent } from './payment-succeed.event';

export enum PaymentEventType {
  PAYMENT_SUCCEED = 'PAYMENT_SUCCEED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export type PaymentEvent =
  | {
      type: PaymentEventType.PAYMENT_FAILED;
      payload: PaymentFailedEvent;
    }
  | {
      type: PaymentEventType.PAYMENT_SUCCEED;
      payload: PaymentSucceedEvent;
    };
