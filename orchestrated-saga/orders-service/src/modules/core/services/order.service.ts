import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderService,
  ProcessPaymentResultInput,
  ProcessReservationResultInput,
} from './interfaces';
import { OrderRepository } from '../repositories';
import {
  OrderItemsReservationPublisher,
  OrderItemsUndoReservationPublisher,
  OrderPaymentPublisher,
  OrderReceiveLoyaltyPointsPublisher,
  OrderSendToDeliverPublisher,
} from '../queues';
import { OrderStatus } from '../entities';

@Injectable()
export class OrderServiceImpl implements OrderService {
  private readonly logger = new Logger(OrderServiceImpl.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderPaymentPublisher: OrderPaymentPublisher,
    private readonly orderSendToDeliverPublisher: OrderSendToDeliverPublisher,
    private readonly orderItemsReservationPublisher: OrderItemsReservationPublisher,
    private readonly orderItemsUndoReservationPublisher: OrderItemsUndoReservationPublisher,
    private readonly orderReceiveLoyaltyPointsPublisher: OrderReceiveLoyaltyPointsPublisher,
  ) {}

  async prepareOrderForPayment(
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

    await this.orderItemsReservationPublisher.publish({
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

  async processReservationResult(
    input: ProcessReservationResultInput,
  ): Promise<void> {
    const order = await this.orderRepository.findOneByUuid(input.orderUuid);

    if (!order) {
      this.logger.error(
        `Order with uuid ${input.orderUuid} not found while processing reservation result`,
      );
      return;
    }

    if (!input.result.success) {
      this.logger.debug(
        `Reservation failed for order ${input.orderUuid}, setting status to ${OrderStatus.UNAVAILABLE_ITEMS}`,
      );
      await this.orderRepository.updateStatus(
        order.id,
        OrderStatus.UNAVAILABLE_ITEMS,
      );
      return;
    }

    this.logger.debug(
      `Reservation succeeded for order ${input.orderUuid}, starting payment processing`,
    );

    await this.orderPaymentPublisher.publish({
      userUuid: input.userUuid,
      orderUuid: input.orderUuid,
      paymentMethodUuid: input.paymentMethodUuid,
      totalPrice: order.totalPrice,
    });

    await this.orderRepository.updateStatus(
      order.id,
      OrderStatus.PAYMENT_PROCESSING,
    );
  }

  async processPaymentResult(input: ProcessPaymentResultInput): Promise<void> {
    const order = await this.orderRepository.findOneByUuid(input.orderUuid);

    if (!order) {
      this.logger.error(
        `Order with uuid ${input.orderUuid} not found while processing payment result`,
      );
      return;
    }

    if (!input.success) {
      this.logger.debug(
        `Payment failed for order ${input.orderUuid}, setting status to ${OrderStatus.PAYMENT_FAILED}`,
      );

      await this.orderItemsUndoReservationPublisher.publish({
        userUuid: order.userUuid,
        orderUuid: order.uuid,
      });

      await this.orderRepository.updateStatus(
        order.id,
        OrderStatus.PAYMENT_FAILED,
      );

      return;
    }

    this.logger.debug(
      `Payment succeeded for order ${input.orderUuid}, setting status to ${OrderStatus.PAYMENT_SUCCEEDED}`,
    );

    await Promise.all([
      this.orderSendToDeliverPublisher.publish({
        userUuid: order.userUuid,
        orderUuid: order.uuid,
      }),
      this.orderReceiveLoyaltyPointsPublisher.publish({
        userUuid: order.userUuid,
        orderUuid: order.uuid,
      }),
    ]);

    await this.orderRepository.updateStatus(
      order.id,
      OrderStatus.PAYMENT_SUCCEEDED,
    );
  }
}
