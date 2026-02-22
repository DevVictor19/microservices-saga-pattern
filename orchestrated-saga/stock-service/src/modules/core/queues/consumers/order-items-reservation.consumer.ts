import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrderItem } from '../../value-objects';
import { ItemReservationService } from '../../services';
import { Logger } from '@nestjs/common';

export const ORDER_ITEMS_RESERVATION_QUEUE = 'order-items-reservation-queue';

export interface OrderItemsReservationPayload {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  items: OrderItem[];
}

@Processor(ORDER_ITEMS_RESERVATION_QUEUE)
export class OrderItemsReservationConsumer extends WorkerHost {
  private readonly logger = new Logger(OrderItemsReservationConsumer.name);

  constructor(private readonly itemReservationService: ItemReservationService) {
    super();
  }

  async process(job: Job<OrderItemsReservationPayload>): Promise<void> {
    try {
      const data = job.data;

      this.logger.debug(
        `Processing reservation for order ${data.orderUuid}: ${JSON.stringify(data)}`,
      );

      await this.itemReservationService.reserveItems(data);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error processing job ${job.id}: ${error.message}`);

        throw error;
      } else {
        this.logger.error(`Unknown error processing job ${job.id}`, error);
      }
    }
  }
}
