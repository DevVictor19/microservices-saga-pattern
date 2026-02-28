import { Injectable, Logger } from '@nestjs/common';
import { ItemDeliveryService, SendToDeliverInput } from './interfaces';
import { ItemDeliveryRepository } from '../repositories';

@Injectable()
export class ItemDeliveryServiceImpl implements ItemDeliveryService {
  private readonly logger = new Logger(ItemDeliveryServiceImpl.name);

  constructor(
    private readonly itemDeliveryRepository: ItemDeliveryRepository,
  ) {}

  async sendToDeliver(input: SendToDeliverInput): Promise<void> {
    await this.itemDeliveryRepository.createDelivery(
      input.userUuid,
      input.orderUuid,
    );

    this.logger.debug(
      `Order ${input.orderUuid} sent to delivery for user ${input.userUuid}`,
    );
  }
}
