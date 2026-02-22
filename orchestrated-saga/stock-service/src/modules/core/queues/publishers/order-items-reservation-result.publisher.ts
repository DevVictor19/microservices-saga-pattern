import { Injectable } from '@nestjs/common';
import {
  OrderItemsReservationResultPayload,
  OrderItemsReservationResultPublisher,
} from './interfaces';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export const ORDER_ITEMS_RESERVATION_RESULT_QUEUE =
  'order-items-reservation-result-queue';

@Injectable()
export class OrderItemsReservationResultPublisherImpl implements OrderItemsReservationResultPublisher {
  constructor(
    @InjectQueue(ORDER_ITEMS_RESERVATION_RESULT_QUEUE)
    private readonly queue: Queue<OrderItemsReservationResultPayload>,
  ) {}

  async publish(payload: OrderItemsReservationResultPayload): Promise<void> {
    await this.queue.add('order-items-reservation-result-job', payload, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
