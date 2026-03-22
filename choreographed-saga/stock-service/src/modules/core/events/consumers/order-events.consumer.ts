import Redis from 'ioredis';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderEvent, OrderEventType } from '../order.event';
import { ItemReservationService } from '../../services';

@Injectable()
export class OrderEventsConsumer implements OnModuleInit {
  private readonly client: Redis;
  private readonly channel = 'order-events';
  private readonly logger = new Logger(OrderEventsConsumer.name);

  constructor(private readonly itemReservationService: ItemReservationService) {
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
          const event = JSON.parse(message) as OrderEvent;
          switch (event.type) {
            case OrderEventType.START_ORDER_PAYMENT:
              void this.itemReservationService.reserveItems(event.payload);
              break;
            default:
              this.logger.warn(
                `Received unknown event type: ${event.type as string}`,
              );
          }
        } catch (error) {
          this.logger.error('Failed to process incoming message', error);
        }
      }
    });
  }
}
