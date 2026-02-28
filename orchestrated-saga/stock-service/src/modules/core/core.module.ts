import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, ItemDelivery, ItemReservation } from './entities';
import {
  ItemDeliveryRepository,
  ItemDeliveryRepositoryImpl,
  ItemReservationRepository,
  ItemReservationRepositoryImpl,
} from './repositories';
import {
  ItemDeliveryService,
  ItemDeliveryServiceImpl,
  ItemReservationService,
  ItemReservationServiceImpl,
} from './services';
import { BullModule } from '@nestjs/bullmq';
import {
  ORDER_ITEMS_RESERVATION_QUEUE,
  ORDER_ITEMS_RESERVATION_RESULT_QUEUE,
  ORDER_ITEMS_UNDO_RESERVATION_QUEUE,
  ORDER_SEND_TO_DELIVER_QUEUE,
  OrderItemsReservationConsumer,
  OrderItemsReservationResultPublisher,
  OrderItemsReservationResultPublisherImpl,
  OrderItemsUndoReservationConsumer,
  OrderSendToDeliverConsumer,
} from './queues';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemReservation, ItemDelivery]),
    BullModule.registerQueue({
      name: ORDER_ITEMS_RESERVATION_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_ITEMS_RESERVATION_RESULT_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_ITEMS_UNDO_RESERVATION_QUEUE,
    }),
    BullModule.registerQueue({
      name: ORDER_SEND_TO_DELIVER_QUEUE,
    }),
  ],
  providers: [
    {
      provide: ItemReservationRepository,
      useClass: ItemReservationRepositoryImpl,
    },
    {
      provide: ItemDeliveryRepository,
      useClass: ItemDeliveryRepositoryImpl,
    },
    {
      provide: ItemReservationService,
      useClass: ItemReservationServiceImpl,
    },
    {
      provide: ItemDeliveryService,
      useClass: ItemDeliveryServiceImpl,
    },
    OrderItemsReservationConsumer,
    OrderItemsUndoReservationConsumer,
    OrderSendToDeliverConsumer,
    {
      provide: OrderItemsReservationResultPublisher,
      useClass: OrderItemsReservationResultPublisherImpl,
    },
  ],
})
export class CoreModule {}
