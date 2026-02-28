import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities';
import { BullModule } from '@nestjs/bullmq';
import {
  ORDER_PAYMENT_QUEUE,
  ORDER_PAYMENT_RESULT_QUEUE,
  OrderPaymentConsumer,
  OrderPaymentResultPublisher,
  OrderPaymentResultPublisherImpl,
} from './queues';
import { PaymentRepository, PaymentRepositoryImpl } from './repositories';
import { PaymentService, PaymentServiceImpl } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    BullModule.registerQueue({
      name: ORDER_PAYMENT_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_PAYMENT_RESULT_QUEUE,
    }),
  ],
  providers: [
    {
      provide: PaymentRepository,
      useClass: PaymentRepositoryImpl,
    },
    {
      provide: PaymentService,
      useClass: PaymentServiceImpl,
    },
    {
      provide: OrderPaymentResultPublisher,
      useClass: OrderPaymentResultPublisherImpl,
    },
    OrderPaymentConsumer,
  ],
})
export class CoreModule {}
