import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order, OrderItem } from './entities';
import { OrderRepository, OrderRepositoryImpl } from './repositories';
import { OrderService, OrderServiceImpl } from './services';
import { OrdersController } from './controllers';
import { OrderEventsPublisher, OrderEventsPublisherImpl } from './events';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
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
      provide: OrderEventsPublisher,
      useClass: OrderEventsPublisherImpl,
    },
  ],
})
export class CoreModule {}
