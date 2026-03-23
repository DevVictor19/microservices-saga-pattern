import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PaymentEventsPublisher } from './interfaces';
import { PaymentFailedEvent } from '../payment-failed.event';
import { PaymentSucceedEvent } from '../payment-succeed.event';
import { PaymentEvent, PaymentEventType } from '../payment.event';

@Injectable()
export class PaymentEventsPublisherImpl implements PaymentEventsPublisher {
  private readonly logger = new Logger(PaymentEventsPublisherImpl.name);
  private readonly client: Redis;
  private readonly channel = 'payment-events';

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async emitPaymentFailedEvent(event: PaymentFailedEvent): Promise<void> {
    await this.publish({
      type: PaymentEventType.PAYMENT_FAILED,
      payload: event,
    });
  }

  async emitPaymentSucceedEvent(event: PaymentSucceedEvent): Promise<void> {
    await this.publish({
      type: PaymentEventType.PAYMENT_SUCCEED,
      payload: event,
    });
  }

  private async publish(event: PaymentEvent): Promise<void> {
    try {
      await this.client.publish(this.channel, JSON.stringify(event));
    } catch (error) {
      this.logger.error('Failed to publish event', error);
      throw error;
    }
  }
}
