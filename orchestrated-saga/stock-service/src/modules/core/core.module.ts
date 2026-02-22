import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, ItemDelivery, ItemReservation } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Item, ItemReservation, ItemDelivery])],
})
export class CoreModule {}
