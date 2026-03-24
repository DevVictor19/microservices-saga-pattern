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
import {
  OrderEventsConsumer,
  PaymentsEventConsumer,
  StockEventsPublisher,
  StockEventsPublisherImpl,
} from './events';

@Module({
  imports: [TypeOrmModule.forFeature([Item, ItemReservation, ItemDelivery])],
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
    OrderEventsConsumer,
    {
      provide: StockEventsPublisher,
      useClass: StockEventsPublisherImpl,
    },
    PaymentsEventConsumer,
  ],
})
export class CoreModule {}
