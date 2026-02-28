import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ORDER_ITEMS_RESERVATION_QUEUE,
  ORDER_ITEMS_RESERVATION_RESULT_QUEUE,
  ORDER_ITEMS_UNDO_RESERVATION_QUEUE,
  ORDER_PAYMENT_QUEUE,
  ORDER_PAYMENT_RESULT_QUEUE,
  ORDER_RECEIVE_LOYALTY_POINTS_QUEUE,
  ORDER_SEND_TO_DELIVER_QUEUE,
  OrderItemsReservationPublisher,
  OrderItemsReservationPublisherImpl,
  OrderItemsReservationResultConsumer,
  OrderItemsUndoReservationPublisher,
  OrderItemsUndoReservationPublisherImpl,
  OrderPaymentPublisher,
  OrderPaymentPublisherImpl,
  OrderPaymentResultConsumer,
  OrderReceiveLoyaltyPointsPublisher,
  OrderReceiveLoyaltyPointsPublisherImpl,
  OrderSendToDeliverPublisher,
  OrderSendToDeliverPublisherImpl,
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
    BullModule.registerQueue({
      name: ORDER_PAYMENT_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_PAYMENT_RESULT_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_ITEMS_UNDO_RESERVATION_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_RECEIVE_LOYALTY_POINTS_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_SEND_TO_DELIVER_QUEUE,
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
    {
      provide: OrderItemsUndoReservationPublisher,
      useClass: OrderItemsUndoReservationPublisherImpl,
    },
    {
      provide: OrderReceiveLoyaltyPointsPublisher,
      useClass: OrderReceiveLoyaltyPointsPublisherImpl,
    },
    {
      provide: OrderSendToDeliverPublisher,
      useClass: OrderSendToDeliverPublisherImpl,
    },
    OrderItemsReservationResultConsumer,
    OrderPaymentResultConsumer,
  ],
})
export class CoreModule {}
