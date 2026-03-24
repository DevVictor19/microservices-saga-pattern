import Redis from 'ioredis';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PaymentEvent, PaymentEventType } from '../payment.event';
import { LoyaltyPointService } from '../../services';

@Injectable()
export class PaymentsEventConsumer implements OnModuleInit {
  private readonly client: Redis;
  private readonly channel = 'payment-events';
  private readonly logger = new Logger(PaymentsEventConsumer.name);

  constructor(private readonly loyaltyPointService: LoyaltyPointService) {
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
              void this.loyaltyPointService.calcLoyaltyPoints({
                orderUuid: event.payload.orderUuid,
                userUuid: event.payload.userUuid,
                totalPrice: event.payload.totalPrice,
              });
              break;
          }
        } catch (error) {
          this.logger.error('Failed to process incoming message', error);
        }
      }
    });
  }
}
