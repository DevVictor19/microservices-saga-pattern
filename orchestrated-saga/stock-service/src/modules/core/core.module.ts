import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, ItemDelivery, ItemReservation } from './entities';
import {
  ItemReservationRepository,
  ItemReservationRepositoryImpl,
} from './repositories';
import { ItemReservationService, ItemReservationServiceImpl } from './services';
import { BullModule } from '@nestjs/bullmq';
import {
  ORDER_ITEMS_RESERVATION_QUEUE,
  ORDER_ITEMS_RESERVATION_RESULT_QUEUE,
  OrderItemsReservationConsumer,
  OrderItemsReservationResultPublisher,
  OrderItemsReservationResultPublisherImpl,
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
  ],
  providers: [
    {
      provide: ItemReservationRepository,
      useClass: ItemReservationRepositoryImpl,
    },
    {
      provide: ItemReservationService,
      useClass: ItemReservationServiceImpl,
    },
    OrderItemsReservationConsumer,
    {
      provide: OrderItemsReservationResultPublisher,
      useClass: OrderItemsReservationResultPublisherImpl,
    },
  ],
})
export class CoreModule {}
