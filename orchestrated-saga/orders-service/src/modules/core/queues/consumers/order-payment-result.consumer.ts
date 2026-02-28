import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrderService } from '../../services';
import { Logger } from '@nestjs/common';

export const ORDER_PAYMENT_RESULT_QUEUE = 'order-payment-result-queue';

export interface OrderPaymentResultPayload {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  success: boolean;
  reason?: string;
}

@Processor(ORDER_PAYMENT_RESULT_QUEUE)
export class OrderPaymentResultConsumer extends WorkerHost {
  private readonly logger = new Logger(OrderPaymentResultConsumer.name);

  constructor(private readonly orderService: OrderService) {
    super();
  }

  async process(job: Job<OrderPaymentResultPayload>): Promise<void> {
    try {
      this.logger.debug(
        `Processing payment result for order ${job.data.orderUuid}`,
      );

      await this.orderService.processPaymentResult(job.data);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error processing payment result for order ${job.data.orderUuid}: ${error.message}`,
        );
        throw error;
      } else {
        this.logger.error(
          `Unknown error processing payment result for order ${job.data.orderUuid}`,
        );
      }
    }
  }
}
