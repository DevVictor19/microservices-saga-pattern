import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities';
import { PaymentRepository, PaymentRepositoryImpl } from './repositories';
import { PaymentService, PaymentServiceImpl } from './services';
import {
  PaymentEventsPublisher,
  PaymentEventsPublisherImpl,
  StockEventsConsumer,
} from './events';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [
    {
      provide: PaymentRepository,
      useClass: PaymentRepositoryImpl,
    },
    {
      provide: PaymentService,
      useClass: PaymentServiceImpl,
    },
    StockEventsConsumer,
    {
      provide: PaymentEventsPublisher,
      useClass: PaymentEventsPublisherImpl,
    },
  ],
})
export class CoreModule {}
