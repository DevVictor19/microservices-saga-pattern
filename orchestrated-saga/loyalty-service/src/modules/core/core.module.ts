import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyPoint } from './entities';
import { BullModule } from '@nestjs/bullmq';
import {
  ORDER_RECEIVE_LOYALTY_POINTS_QUEUE,
  OrderReceiveLoyaltyPointsConsumer,
} from './queues';
import {
  LoyaltyPointRepository,
  LoyaltyPointRepositoryImpl,
} from './repositories';
import { LoyaltyPointService, LoyaltyPointServiceImpl } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoyaltyPoint]),
    BullModule.registerQueue({
      name: ORDER_RECEIVE_LOYALTY_POINTS_QUEUE,
    }),
  ],
  providers: [
    {
      provide: LoyaltyPointRepository,
      useClass: LoyaltyPointRepositoryImpl,
    },
    {
      provide: LoyaltyPointService,
      useClass: LoyaltyPointServiceImpl,
    },
    OrderReceiveLoyaltyPointsConsumer,
  ],
})
export class CoreModule {}
