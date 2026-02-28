import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ItemReservationService } from '../../services';
import { Logger } from '@nestjs/common';

export const ORDER_ITEMS_UNDO_RESERVATION_QUEUE =
  'order-items-undo-reservation-queue';

export interface UndoReservationPayload {
  userUuid: string;
  orderUuid: string;
}

@Processor(ORDER_ITEMS_UNDO_RESERVATION_QUEUE)
export class OrderItemsUndoReservationConsumer extends WorkerHost {
  private readonly logger = new Logger(OrderItemsUndoReservationConsumer.name);

  constructor(private readonly itemReservationService: ItemReservationService) {
    super();
  }

  async process(job: Job<UndoReservationPayload>): Promise<void> {
    try {
      this.logger.debug(
        `Processing undo reservation for order ${job.data.orderUuid}`,
      );

      await this.itemReservationService.undoReservation({
        userUuid: job.data.userUuid,
        orderUuid: job.data.orderUuid,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to undo item reservations for order ${job.data.orderUuid}: ${error.message}`,
        );
        throw error;
      } else {
        this.logger.error(
          `Failed to undo item reservations for order ${job.data.orderUuid}: Unknown error`,
        );
      }
    }
  }
}
