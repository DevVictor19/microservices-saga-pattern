import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ItemDeliveryService } from '../../services';

export const ORDER_SEND_TO_DELIVER_QUEUE = 'order-send-to-deliver-queue';

export interface SendToDeliverPayload {
  userUuid: string;
  orderUuid: string;
}

@Processor(ORDER_SEND_TO_DELIVER_QUEUE)
export class OrderSendToDeliverConsumer extends WorkerHost {
  private readonly logger = new Logger(OrderSendToDeliverConsumer.name);

  constructor(private readonly itemDeliveryService: ItemDeliveryService) {
    super();
  }

  async process(job: Job<SendToDeliverPayload>): Promise<void> {
    try {
      this.logger.debug(
        `Sending order ${job.data.orderUuid} to delivery for user ${job.data.userUuid}`,
      );

      await this.itemDeliveryService.sendToDeliver({
        userUuid: job.data.userUuid,
        orderUuid: job.data.orderUuid,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to process job ${job.id} for order ${job.data.orderUuid}: ${error.message}`,
        );
        throw error;
      } else {
        this.logger.error(
          `Failed to process job ${job.id} for order ${job.data.orderUuid}: ${error}`,
        );
      }
    }
  }
}
