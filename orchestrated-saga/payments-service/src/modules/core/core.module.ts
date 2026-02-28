import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
})
export class CoreModule {}
