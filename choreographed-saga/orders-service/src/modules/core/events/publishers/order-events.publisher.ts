import { Injectable, Logger } from '@nestjs/common';
import { OrderEventsPublisher } from './interfaces';
import { StartOrderPaymentEvent } from '../start-order-payment.event';
import Redis from 'ioredis';
import { OrderEvent, OrderEventType } from '../order.event';

@Injectable()
export class OrderEventsPublisherImpl implements OrderEventsPublisher {
  private readonly logger = new Logger(OrderEventsPublisherImpl.name);
  private readonly client: Redis;
  private readonly channel = 'order-events';

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async emitStartOrderPaymentEvent(
    event: StartOrderPaymentEvent,
  ): Promise<void> {
    await this.publish({
      type: OrderEventType.START_ORDER_PAYMENT,
      payload: event,
    });
  }

  private async publish(event: OrderEvent): Promise<void> {
    try {
      await this.client.publish(this.channel, JSON.stringify(event));
    } catch (error) {
      this.logger.error('Failed to publish event', error);
      throw error;
    }
  }
}
