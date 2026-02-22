import { Injectable } from '@nestjs/common';
import {
  OrderItemsReservationPayload,
  OrderItemsReservationPublisher,
} from './interfaces';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export const ORDER_ITEMS_RESERVATION_QUEUE = 'order-items-reservation-queue';

@Injectable()
export class OrderItemsReservationPublisherImpl implements OrderItemsReservationPublisher {
  constructor(
    @InjectQueue(ORDER_ITEMS_RESERVATION_QUEUE)
    private readonly queue: Queue<OrderItemsReservationPayload>,
  ) {}

  async publish(payload: OrderItemsReservationPayload): Promise<void> {
    await this.queue.add('order-items-reservation-job', payload, {
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
