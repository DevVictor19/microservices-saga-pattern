import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderService,
  ProcessReservationFailedInput,
  ProcessReservationSucceedInput,
} from './interfaces';
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
      totalPrice: order.totalPrice,
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

  async processReservationSucceed(
    input: ProcessReservationSucceedInput,
  ): Promise<void> {
    const order = await this.orderRepository.findOneByUuid(input.orderUuid);

    if (!order) {
      this.logger.error(
        `Order with uuid ${input.orderUuid} not found while processing reservation result`,
      );
      return;
    }

    this.logger.debug(
      `Reservation succeeded for order ${input.orderUuid}, starting payment processing`,
    );

    await this.orderRepository.updateStatus(
      order.id,
      OrderStatus.PAYMENT_PROCESSING,
    );
  }

  async processReservationFailed(
    input: ProcessReservationFailedInput,
  ): Promise<void> {
    const order = await this.orderRepository.findOneByUuid(input.orderUuid);

    if (!order) {
      this.logger.error(
        `Order with uuid ${input.orderUuid} not found while processing reservation result`,
      );
      return;
    }

    this.logger.debug(
      `Reservation failed for order ${input.orderUuid}, setting status to ${OrderStatus.UNAVAILABLE_ITEMS}`,
    );
    await this.orderRepository.updateStatus(
      order.id,
      OrderStatus.UNAVAILABLE_ITEMS,
    );
  }
}
