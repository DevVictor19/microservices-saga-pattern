import { Injectable } from '@nestjs/common';
import {
  OrderSendToDeliverPublisher,
  SendToDeliverPayload,
} from './interfaces';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export const ORDER_SEND_TO_DELIVER_QUEUE = 'order-send-to-deliver-queue';

@Injectable()
export class OrderSendToDeliverPublisherImpl implements OrderSendToDeliverPublisher {
  constructor(
    @InjectQueue(ORDER_SEND_TO_DELIVER_QUEUE)
    private readonly queue: Queue<SendToDeliverPayload>,
  ) {}

  async publish(payload: SendToDeliverPayload): Promise<void> {
    await this.queue.add('send-to-deliver-job', payload, {
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
