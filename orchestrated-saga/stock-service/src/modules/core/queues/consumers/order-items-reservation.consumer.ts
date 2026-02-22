import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrderItem } from '../../value-objects';
import { ItemReservationService } from '../../services';

export const ORDER_ITEMS_RESERVATION_QUEUE = 'order-items-reservation-queue';

export interface OrderItemsReservationPayload {
  userUuid: string;
  orderUuid: string;
  items: OrderItem[];
}

@Processor(ORDER_ITEMS_RESERVATION_QUEUE)
export class OrderItemsReservationConsumer extends WorkerHost {
  constructor(private readonly itemReservationService: ItemReservationService) {
    super();
  }

  async process(job: Job<OrderItemsReservationPayload>): Promise<any> {
    await this.itemReservationService.reserveItems(job.data);
  }
}
