import { Injectable, Logger } from '@nestjs/common';
import {
  ItemReservationService,
  ReserveItemsInput,
  UndoReservationInput,
} from './interfaces';
import { ItemReservationRepository } from '../repositories';
import { setTimeout } from 'node:timers/promises';
import { StockEventsPublisher } from '../events';

@Injectable()
export class ItemReservationServiceImpl implements ItemReservationService {
  private readonly logger = new Logger(ItemReservationServiceImpl.name);

  constructor(
    private readonly itemReservationRepository: ItemReservationRepository,
    private readonly stockEventsPublisher: StockEventsPublisher,
  ) {}

  async reserveItems(input: ReserveItemsInput): Promise<void> {
    await setTimeout(10000);

    const result = await this.itemReservationRepository.reserveItems(input);

    this.logger.debug(
      `Reserved items for order ${input.orderUuid} - success status: ${result.success}`,
    );

    if (!result.success) {
      await this.stockEventsPublisher.emitItemReservationFailedEvent({
        userUuid: input.userUuid,
        orderUuid: input.orderUuid,
        paymentMethodUuid: input.paymentMethodUuid,
        failedItems: result.failedItems,
      });
      return;
    }

    await this.stockEventsPublisher.emitItemReservationSucceedEvent({
      userUuid: input.userUuid,
      orderUuid: input.orderUuid,
      paymentMethodUuid: input.paymentMethodUuid,
      reservationUuids: result.reservationUuids,
    });
  }

  async undoReservation(input: UndoReservationInput): Promise<void> {
    await setTimeout(10000);

    await this.itemReservationRepository.undoReservation(input.orderUuid);

    this.logger.debug(`Undid reservation for order ${input.orderUuid}`);
  }
}
