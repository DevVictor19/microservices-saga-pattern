import { Injectable } from '@nestjs/common';
import { LoyaltyPointRepository } from './interfaces';
import { LoyaltyPoint } from '../entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LoyaltyPointRepositoryImpl implements LoyaltyPointRepository {
  constructor(
    @InjectRepository(LoyaltyPoint)
    private readonly repository: Repository<LoyaltyPoint>,
  ) {}

  async save(loyaltyPoint: LoyaltyPoint): Promise<void> {
    await this.repository.save(loyaltyPoint);
  }
}
