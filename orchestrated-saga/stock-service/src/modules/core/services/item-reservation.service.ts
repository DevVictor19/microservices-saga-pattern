import { Injectable, Logger } from '@nestjs/common';
import {
  ItemReservationService,
  ReserveItemsInput,
  UndoReservationInput,
} from './interfaces';
import { ItemReservationRepository } from '../repositories';
import { OrderItemsReservationResultPublisher } from '../queues';

@Injectable()
export class ItemReservationServiceImpl implements ItemReservationService {
  private readonly logger = new Logger(ItemReservationServiceImpl.name);

  constructor(
    private readonly itemReservationRepository: ItemReservationRepository,
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
    await this.itemReservationRepository.undoReservation(input.orderUuid);

    this.logger.debug(`Undid reservation for order ${input.orderUuid}`);
  }
}
