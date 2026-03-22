import Redis from 'ioredis';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StockEvent, StockEventType } from '../stock.event';
import { OrderService } from '../../services';

@Injectable()
export class StockEventsConsumer implements OnModuleInit {
  private readonly client: Redis;
  private readonly channel = 'stock-events';
  private readonly logger = new Logger(StockEventsConsumer.name);

  constructor(private readonly orderService: OrderService) {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      enableReadyCheck: false,
    });
  }

  async onModuleInit() {
    try {
      await this.client.subscribe(this.channel);
    } catch (error) {
      this.logger.error('Failed to subscribe to channel', error);
      throw error;
    }

    this.client.on('message', (channel, message) => {
      if (channel === this.channel) {
        try {
          const event = JSON.parse(message) as StockEvent;
          switch (event.type) {
            case StockEventType.RESERVATION_SUCCEED:
              void this.orderService.processReservationSucceed(event.payload);
              break;
            case StockEventType.RESERVATION_FAILED:
              void this.orderService.processReservationFailed(event.payload);
              break;
            default:
              this.logger.warn(
                `Received unknown event type: ${(event as StockEvent).type}`,
              );
          }
        } catch (error) {
          this.logger.error('Failed to process incoming message', error);
        }
      }
    });
  }
}
