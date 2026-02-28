import { Injectable, Logger } from '@nestjs/common';
import {
  ItemReservationService,
  ReserveItemsInput,
  UndoReservationInput,
} from './interfaces';
import {
  ItemRepository,
  ItemReservationRepository,
  ItemToIncrement,
} from '../repositories';
import { OrderItemsReservationResultPublisher } from '../queues';

@Injectable()
export class ItemReservationServiceImpl implements ItemReservationService {
  private readonly logger = new Logger(ItemReservationServiceImpl.name);

  constructor(
    private readonly itemReservationRepository: ItemReservationRepository,
    private readonly itemRepository: ItemRepository,
    private readonly orderItemsReservationResultPublisher: OrderItemsReservationResultPublisher,
  ) {}

  async reserveItems(input: ReserveItemsInput): Promise<void> {
    const result = await this.itemReservationRepository.reserveItems(input);

    this.logger.debug(
      `Reserved items for order ${input.orderUuid} - success status: ${result.success}`,
    );

    await this.orderItemsReservationResultPublisher.publish({
      userUuid: input.userUuid,
      orderUuid: input.orderUuid,
      paymentMethodUuid: input.paymentMethodUuid,
      result,
    });
  }

  async undoReservation(input: UndoReservationInput): Promise<void> {
    const items = await this.itemReservationRepository.findManyByOrderUuid(
      input.orderUuid,
    );

    if (items.length === 0) {
      this.logger.warn(
        `No reservations found for order ${input.orderUuid} to undo`,
      );
      return;
    }

    const itemsToIncrement: ItemToIncrement[] = items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
    }));
    await this.itemRepository.incrementStock(itemsToIncrement);

    this.logger.debug(
      `Undid reservation for order ${input.orderUuid} - incremented stock for ${itemsToIncrement.length} items`,
    );
  }
}
