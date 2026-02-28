import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LoyaltyPointService } from '../../services';

export const ORDER_RECEIVE_LOYALTY_POINTS_QUEUE =
  'order-receive-loyalty-points-queue';

export interface ReceiveLoyaltyPointsPayload {
  userUuid: string;
  orderUuid: string;
  totalPrice: number;
}

@Processor(ORDER_RECEIVE_LOYALTY_POINTS_QUEUE)
export class OrderReceiveLoyaltyPointsConsumer extends WorkerHost {
  private readonly logger = new Logger(OrderReceiveLoyaltyPointsConsumer.name);

  constructor(private readonly loyaltyPointService: LoyaltyPointService) {
    super();
  }

  async process(job: Job<ReceiveLoyaltyPointsPayload>): Promise<void> {
    try {
      this.logger.debug(
        `Calculating loyalty points for order ${job.data.orderUuid}`,
      );
      await this.loyaltyPointService.calcLoyaltyPoints({
        userUuid: job.data.userUuid,
        orderUuid: job.data.orderUuid,
        totalPrice: job.data.totalPrice,
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
