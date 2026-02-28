import { Injectable, Logger } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { PaymentService, ProcessPaymentInput } from './interfaces';
import { PaymentRepository } from '../repositories';
import { Payment, PaymentStatus } from '../entities';
import { OrderPaymentResultPublisher } from '../queues';

@Injectable()
export class PaymentServiceImpl implements PaymentService {
  private readonly logger = new Logger(PaymentServiceImpl.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderPaymentResultPublisher: OrderPaymentResultPublisher,
  ) {}

  async processPayment(input: ProcessPaymentInput): Promise<void> {
    const payment = await this.paymentRepository.findByUserOrderAndMethod(
      input.userUuid,
      input.orderUuid,
      input.paymentMethodUuid,
    );

    if (payment) {
      this.logger.warn(
        `Payment already exists for user ${input.userUuid}, order ${input.orderUuid}, and payment method ${input.paymentMethodUuid}`,
      );
      return;
    }

    const newPayment = await this.paymentRepository.save(
      this.createPayment(input),
    );

    await setTimeout(5000);

    if (input.paymentMethodUuid === 'ff1a8411-b443-408f-8012-fa62eb9067bd') {
      this.logger.error(
        `Payment failed for user ${input.userUuid}, order ${input.orderUuid}, and payment method ${input.paymentMethodUuid}`,
      );

      await this.paymentRepository.updateStatus(
        newPayment.id,
        PaymentStatus.FAILED,
      );

      await this.orderPaymentResultPublisher.publish({
        orderUuid: input.orderUuid,
        paymentMethodUuid: input.paymentMethodUuid,
        userUuid: input.userUuid,
        success: false,
        reason: 'Payment method declined',
      });

      return;
    }

    this.logger.debug(
      `Payment succeeded for user ${input.userUuid}, order ${input.orderUuid}, and payment method ${input.paymentMethodUuid}`,
    );

    await this.paymentRepository.updateStatus(
      newPayment.id,
      PaymentStatus.COMPLETED,
    );

    await this.orderPaymentResultPublisher.publish({
      orderUuid: input.orderUuid,
      paymentMethodUuid: input.paymentMethodUuid,
      userUuid: input.userUuid,
      success: true,
    });
  }

  private createPayment(input: ProcessPaymentInput): Payment {
    const payment = new Payment();
    payment.uuid = randomUUID();
    payment.userUuid = input.userUuid;
    payment.orderUuid = input.orderUuid;
    payment.paymentMethodUuid = input.paymentMethodUuid;
    payment.status = PaymentStatus.PENDING;
    payment.totalPrice = input.totalPrice;
    return payment;
  }
}
