import { Injectable } from '@nestjs/common';
import {
  ItemReservationRepository,
  ReserveItemsInput,
  ReserveItemsOutput,
} from './interfaces';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Item, ItemReservation } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ItemReservationRepositoryImpl implements ItemReservationRepository {
  constructor(
    @InjectRepository(ItemReservation)
    private readonly repository: Repository<ItemReservation>,
  ) {}

  async reserveItems(input: ReserveItemsInput): Promise<ReserveItemsOutput> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { userUuid, orderUuid, items } = input;
      const reservationUuids: string[] = [];
      const failedItems = [];

      for (const orderItem of items) {
        const item = await queryRunner.manager
          .getRepository(Item)
          .createQueryBuilder('item')
          .where('item.uuid = :uuid', { uuid: orderItem.itemUuid })
          .setLock('pessimistic_write')
          .getOne();

        if (!item || item.quantityInStock < orderItem.quantity) {
          failedItems.push(orderItem);
          continue;
        }

        await queryRunner.manager
          .getRepository(Item)
          .decrement({ id: item.id }, 'quantityInStock', orderItem.quantity);

        const reservation = queryRunner.manager
          .getRepository(ItemReservation)
          .create({
            uuid: randomUUID(),
            itemId: item.id,
            userUuid,
            orderUuid,
            quantity: orderItem.quantity,
          });

        const savedReservation = await queryRunner.manager.save(reservation);
        reservationUuids.push(savedReservation.uuid);
      }

      if (failedItems.length > 0) {
        await queryRunner.rollbackTransaction();
        return { success: false, failedItems };
      }

      await queryRunner.commitTransaction();
      return { success: true, reservationUuids };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findManyByOrderUuid(orderUuid: string): Promise<ItemReservation[]> {
    return this.repository.find({ where: { orderUuid } });
  }
}
