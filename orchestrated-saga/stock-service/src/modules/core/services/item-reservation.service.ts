import { Injectable } from '@nestjs/common';
import { ItemReservationService, ReserveItemsInput } from './interfaces';
import { ItemReservationRepository } from '../repositories';
import { OrderItemsReservationResultPublisher } from '../queues';

@Injectable()
export class ItemReservationServiceImpl implements ItemReservationService {
  constructor(
    private readonly itemReservationRepository: ItemReservationRepository,
    private readonly orderItemsReservationResultPublisher: OrderItemsReservationResultPublisher,
  ) {}

  async reserveItems(input: ReserveItemsInput): Promise<void> {
    const result = await this.itemReservationRepository.reserveItems(input);

    await this.orderItemsReservationResultPublisher.publish({
      userUuid: input.userUuid,
      orderUuid: input.orderUuid,
      result,
    });
  }
}
