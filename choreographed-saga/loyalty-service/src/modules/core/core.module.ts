import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyPoint } from './entities';
import {
  LoyaltyPointRepository,
  LoyaltyPointRepositoryImpl,
} from './repositories';
import { LoyaltyPointService, LoyaltyPointServiceImpl } from './services';
import { PaymentsEventConsumer } from './events';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyPoint])],
  providers: [
    {
      provide: LoyaltyPointRepository,
      useClass: LoyaltyPointRepositoryImpl,
    },
    {
      provide: LoyaltyPointService,
      useClass: LoyaltyPointServiceImpl,
    },
    PaymentsEventConsumer,
  ],
})
export class CoreModule {}
