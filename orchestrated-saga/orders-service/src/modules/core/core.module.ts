import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ORDER_ITEMS_RESERVATION_QUEUE,
  ORDER_ITEMS_RESERVATION_RESULT_QUEUE,
  OrderItemsReservationPublisher,
  OrderItemsReservationPublisherImpl,
  OrderItemsReservationResultConsumer,
  OrderPaymentPublisher,
  OrderPaymentPublisherImpl,
} from './queues';
import { Order, OrderItem } from './entities';
import { OrderRepository, OrderRepositoryImpl } from './repositories';
import { OrderService, OrderServiceImpl } from './services';
import { OrdersController } from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    BullModule.registerQueue({
      name: ORDER_ITEMS_RESERVATION_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_ITEMS_RESERVATION_RESULT_QUEUE,
    }),
  ],
  controllers: [OrdersController],
  providers: [
    {
      provide: OrderRepository,
      useClass: OrderRepositoryImpl,
    },
    {
      provide: OrderService,
      useClass: OrderServiceImpl,
    },
    {
      provide: OrderItemsReservationPublisher,
      useClass: OrderItemsReservationPublisherImpl,
    },
    {
      provide: OrderPaymentPublisher,
      useClass: OrderPaymentPublisherImpl,
    },
    OrderItemsReservationResultConsumer,
  ],
})
export class CoreModule {}
