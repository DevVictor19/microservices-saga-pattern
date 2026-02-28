import { Injectable, Logger } from '@nestjs/common';
import { CalcLoyaltyPointsInput, LoyaltyPointService } from './interfaces';
import { LoyaltyPointRepository } from '../repositories';
import { LoyaltyPoint } from '../entities';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LoyaltyPointServiceImpl implements LoyaltyPointService {
  private readonly logger = new Logger(LoyaltyPointServiceImpl.name);
  private readonly pointsPerCents = 0.25;

  constructor(
    private readonly loyaltyPointRepository: LoyaltyPointRepository,
  ) {}

  async calcLoyaltyPoints(input: CalcLoyaltyPointsInput): Promise<void> {
    const loyaltyPoint = this.createLoyaltyPoint(input);
    await this.loyaltyPointRepository.save(loyaltyPoint);
    this.logger.debug(
      `Loyalty points calculated and saved for order ${input.orderUuid}`,
    );
  }

  private createLoyaltyPoint(input: CalcLoyaltyPointsInput): LoyaltyPoint {
    const points = Math.floor(input.totalPrice * this.pointsPerCents);
    const loyaltyPoint = new LoyaltyPoint();
    loyaltyPoint.uuid = randomUUID();
    loyaltyPoint.userUuid = input.userUuid;
    loyaltyPoint.orderUuid = input.orderUuid;
    loyaltyPoint.points = points;
    return loyaltyPoint;
  }
}
