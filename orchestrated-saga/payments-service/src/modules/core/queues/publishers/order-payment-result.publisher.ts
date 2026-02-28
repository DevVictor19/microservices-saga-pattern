import { Injectable } from '@nestjs/common';
import {
  OrderPaymentResultPayload,
  OrderPaymentResultPublisher,
} from './interfaces';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export const ORDER_PAYMENT_RESULT_QUEUE = 'order-payment-result-queue';

@Injectable()
export class OrderPaymentResultPublisherImpl implements OrderPaymentResultPublisher {
  constructor(
    @InjectQueue(ORDER_PAYMENT_RESULT_QUEUE)
    private readonly queue: Queue<OrderPaymentResultPayload>,
  ) {}

  async publish(payload: OrderPaymentResultPayload): Promise<void> {
    await this.queue.add('payment-result-job', payload, {
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
