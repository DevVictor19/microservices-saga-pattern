import { Injectable } from '@nestjs/common';
import {
  OrderReceiveLoyaltyPointsPublisher,
  ReceiveLoyaltyPointsPayload,
} from './interfaces';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export const ORDER_RECEIVE_LOYALTY_POINTS_QUEUE =
  'order-receive-loyalty-points-queue';

@Injectable()
export class OrderReceiveLoyaltyPointsPublisherImpl implements OrderReceiveLoyaltyPointsPublisher {
  constructor(
    @InjectQueue(ORDER_RECEIVE_LOYALTY_POINTS_QUEUE)
    private readonly queue: Queue<ReceiveLoyaltyPointsPayload>,
  ) {}

  async publish(payload: ReceiveLoyaltyPointsPayload): Promise<void> {
    await this.queue.add('receive-loyalty-points-job', payload, {
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
