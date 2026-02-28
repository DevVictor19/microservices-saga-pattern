import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrderService } from '../../services';

export type ItemsReservationResult =
  | {
      success: true;
      reservationUuids: string[];
    }
  | {
      success: false;
      failedItems: Array<{
        itemUuid: string;
        quantity: number;
      }>;
    };

export interface OrderItemsReservationResultPayload {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  result: ItemsReservationResult;
}

export const ORDER_ITEMS_RESERVATION_RESULT_QUEUE =
  'order-items-reservation-result-queue';

@Processor(ORDER_ITEMS_RESERVATION_RESULT_QUEUE)
export class OrderItemsReservationResultConsumer extends WorkerHost {
  private readonly logger = new Logger(
    OrderItemsReservationResultConsumer.name,
  );

  constructor(private readonly orderService: OrderService) {
    super();
  }

  async process(job: Job<OrderItemsReservationResultPayload>): Promise<void> {
    try {
      this.logger.debug(
        `Processing reservation result for order ${job.data.orderUuid}`,
      );

      await this.orderService.processReservationResult(job.data);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error processing reservation result for order ${job.data.orderUuid}: ${error.message}`,
        );
      } else {
        this.logger.error(
          `Unknown error processing reservation result for order ${job.data.orderUuid}`,
        );
      }
    }
  }
}
