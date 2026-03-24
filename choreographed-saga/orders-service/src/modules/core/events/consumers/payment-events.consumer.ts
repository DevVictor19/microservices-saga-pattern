import Redis from 'ioredis';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderService } from '../../services';
import { PaymentEvent, PaymentEventType } from '../payment.event';

@Injectable()
export class PaymentsEventConsumer implements OnModuleInit {
  private readonly client: Redis;
  private readonly channel = 'payment-events';
  private readonly logger = new Logger(PaymentsEventConsumer.name);

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
          const event = JSON.parse(message) as PaymentEvent;
          switch (event.type) {
            case PaymentEventType.PAYMENT_SUCCEED:
              void this.orderService.processPaymentSucceed(event.payload);
              break;
            case PaymentEventType.PAYMENT_FAILED:
              void this.orderService.processPaymentFailed(event.payload);
              break;
          }
        } catch (error) {
          this.logger.error('Failed to process incoming message', error);
        }
      }
    });
  }
}
