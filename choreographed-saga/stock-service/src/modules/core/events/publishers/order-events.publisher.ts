import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { StockEventsPublisher } from './interfaces';
import { ItemReservationFailedEvent } from '../item-reservation-failed.event';
import { ItemReservationSucceedEvent } from '../item-reservation-succeed.event';
import { StockEvent, StockEventType } from '../stock.event';

@Injectable()
export class StockEventsPublisherImpl implements StockEventsPublisher {
  private readonly logger = new Logger(StockEventsPublisherImpl.name);
  private readonly client: Redis;
  private readonly channel = 'stock-events';

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async emitItemReservationSucceedEvent(
    event: ItemReservationSucceedEvent,
  ): Promise<void> {
    await this.publish({
      type: StockEventType.RESERVATION_SUCCEED,
      payload: event,
    });
  }

  async emitItemReservationFailedEvent(
    event: ItemReservationFailedEvent,
  ): Promise<void> {
    await this.publish({
      type: StockEventType.RESERVATION_FAILED,
      payload: event,
    });
  }

  private async publish(event: StockEvent): Promise<void> {
    try {
      await this.client.publish(this.channel, JSON.stringify(event));
    } catch (error) {
      this.logger.error('Failed to publish event', error);
      throw error;
    }
  }
}
