import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PaymentService } from '../../services';

export const ORDER_PAYMENT_QUEUE = 'order-payment-queue';

export interface OrderPaymentPayload {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  totalPrice: number;
}

@Processor(ORDER_PAYMENT_QUEUE)
export class OrderPaymentConsumer extends WorkerHost {
  private readonly logger = new Logger(OrderPaymentConsumer.name);

  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  async process(job: Job<OrderPaymentPayload>): Promise<void> {
    try {
      this.logger.debug(`Processing payment for order ${job.data.orderUuid}`);

      await this.paymentService.processPayment(job.data);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error processing payment for order ${job.data.orderUuid}: ${error.message}`,
        );
        throw error;
      } else {
        this.logger.error(
          `Unknown error processing payment for order ${job.data.orderUuid}`,
        );
      }
    }
  }
}
