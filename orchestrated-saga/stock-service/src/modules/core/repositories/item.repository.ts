import { Injectable } from '@nestjs/common';
import { ItemRepository, ItemToIncrement } from './interfaces';
import { Repository } from 'typeorm';
import { Item } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ItemRepositoryImpl implements ItemRepository {
  constructor(
    @InjectRepository(Item)
    private readonly repository: Repository<Item>,
  ) {}

  async incrementStock(items: ItemToIncrement[]): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      for (const item of items) {
        await manager
          .getRepository(Item)
          .increment({ id: item.itemId }, 'quantityInStock', item.quantity);
      }
    });
  }
}
