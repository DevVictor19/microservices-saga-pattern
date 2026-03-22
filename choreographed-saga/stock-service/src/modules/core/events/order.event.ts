import { StartOrderPaymentEvent } from './start-order-payment.event';

export enum OrderEventType {
  START_ORDER_PAYMENT = 'START_ORDER_PAYMENT',
}

export type OrderEvent = {
  type: OrderEventType.START_ORDER_PAYMENT;
  payload: StartOrderPaymentEvent;
};
