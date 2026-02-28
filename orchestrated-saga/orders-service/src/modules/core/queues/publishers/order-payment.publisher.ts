import { Injectable } from '@nestjs/common';
import { OrderPaymentPayload, OrderPaymentPublisher } from './interfaces';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const ORDER_PAYMENT_QUEUE = 'order-payment-queue';

@Injectable()
export class OrderPaymentPublisherImpl implements OrderPaymentPublisher {
  constructor(
    @InjectQueue(ORDER_PAYMENT_QUEUE)
    private readonly queue: Queue<OrderPaymentPayload>,
  ) {}

  async publish(payload: OrderPaymentPayload): Promise<void> {
    await this.queue.add('order-payment-job', payload, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      deduplication: {
        id: payload.orderUuid,
      },
    });
  }
}
