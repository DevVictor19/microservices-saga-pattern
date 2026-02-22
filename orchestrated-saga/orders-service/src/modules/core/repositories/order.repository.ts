import { Injectable } from '@nestjs/common';
import { OrderRepository } from './interfaces';
import { Order, OrderStatus } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  async findOneByUuid(uuid: string): Promise<Order | null> {
    return this.repository.findOne({ where: { uuid } });
  }

  async updateStatus(id: number, status: OrderStatus): Promise<void> {
    await this.repository.update(id, { status });
  }
}
