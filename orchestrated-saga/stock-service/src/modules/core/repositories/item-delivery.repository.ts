import { Injectable } from '@nestjs/common';
import { ItemDeliveryRepository } from './interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemDelivery, ItemReservation } from '../entities';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';

@Injectable()
export class ItemDeliveryRepositoryImpl implements ItemDeliveryRepository {
  constructor(
    @InjectRepository(ItemDelivery)
    private readonly repository: Repository<ItemDelivery>,
  ) {}

  async createDelivery(userUuid: string, orderUuid: string): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const reservedItems = await manager.getRepository(ItemReservation).find({
        where: { orderUuid },
      });

      if (reservedItems.length === 0) {
        return;
      }

      const afterOneMonth = new Date();
      afterOneMonth.setMonth(afterOneMonth.getMonth() + 1);

      const deliveries = reservedItems.map((reservation) => {
        const delivery = new ItemDelivery();
        delivery.uuid = randomUUID();
        delivery.userUuid = userUuid;
        delivery.orderUuid = orderUuid;
        delivery.itemId = reservation.itemId;
        delivery.quantity = reservation.quantity;
        delivery.deliveryForecast = afterOneMonth;
        return delivery;
      });

      await manager.getRepository(ItemDelivery).save(deliveries);
      await manager.getRepository(ItemReservation).delete({ orderUuid });
    });
  }
}
