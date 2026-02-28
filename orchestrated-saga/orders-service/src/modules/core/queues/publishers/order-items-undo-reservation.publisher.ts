import { Injectable } from '@nestjs/common';
import {
  OrderItemsUndoReservationPublisher,
  UndoReservationPayload,
} from './interfaces';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const ORDER_ITEMS_UNDO_RESERVATION_QUEUE =
  'order-items-undo-reservation-queue';

@Injectable()
export class OrderItemsUndoReservationPublisherImpl implements OrderItemsUndoReservationPublisher {
  constructor(
    @InjectQueue(ORDER_ITEMS_UNDO_RESERVATION_QUEUE)
    private readonly queue: Queue<UndoReservationPayload>,
  ) {}

  async publish(payload: UndoReservationPayload): Promise<void> {
    await this.queue.add('undo-reservation-job', payload, {
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
