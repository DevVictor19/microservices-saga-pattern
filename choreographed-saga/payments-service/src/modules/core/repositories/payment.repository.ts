import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './interface';
import { Payment, PaymentStatus } from '../entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    return this.repository.save(payment);
  }

  async updateStatus(id: number, status: PaymentStatus): Promise<void> {
    await this.repository.update(id, { status });
  }

  async findByUserOrderAndMethod(
    userUuid: string,
    orderUuid: string,
    paymentMethodUuid: string,
  ): Promise<Payment | null> {
    return await this.repository.findOne({
      where: {
        userUuid,
        orderUuid,
        paymentMethodUuid,
      },
    });
  }
}
