import Redis from 'ioredis';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StockEvent, StockEventType } from '../stock.event';
import { PaymentService } from '../../services';

@Injectable()
export class StockEventsConsumer implements OnModuleInit {
  private readonly client: Redis;
  private readonly channel = 'stock-events';
  private readonly logger = new Logger(StockEventsConsumer.name);

  constructor(private readonly paymentService: PaymentService) {
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
              void this.paymentService.processPayment(event.payload);
              break;
          }
        } catch (error) {
          this.logger.error('Failed to process incoming message', error);
        }
      }
    });
  }
}
