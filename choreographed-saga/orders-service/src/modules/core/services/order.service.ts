import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderService } from './interfaces';
import { OrderRepository } from '../repositories';
import { OrderStatus } from '../entities';
import { OrderEventsPublisher } from '../events';

@Injectable()
export class OrderServiceImpl implements OrderService {
  private readonly logger = new Logger(OrderServiceImpl.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderEventsPublisher: OrderEventsPublisher,
  ) {}

  async startOrderPayment(
    orderUuid: string,
    paymentMethodUuid: string,
  ): Promise<void> {
    const order = await this.orderRepository.findOneByUuid(orderUuid);

    if (!order) {
      throw new NotFoundException(`Order with uuid ${orderUuid} not found`);
    }

    if (order.status !== OrderStatus.WAITING_PAYMENT) {
      throw new BadRequestException('Invalid status for payment');
    }

    this.logger.debug(`Starting order payment process ${orderUuid}`);

    await this.orderEventsPublisher.emitStartOrderPaymentEvent({
      userUuid: order.userUuid,
      orderUuid,
      paymentMethodUuid,
      items: order.orderItems.map((d) => ({
        itemUuid: d.itemUuid,
        quantity: d.quantity,
      })),
    });

    await this.orderRepository.updateStatus(
      order.id,
      OrderStatus.RESERVING_ITEMS,
    );
  }
}
