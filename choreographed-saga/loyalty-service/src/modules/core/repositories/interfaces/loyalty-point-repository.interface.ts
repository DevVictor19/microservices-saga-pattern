import { LoyaltyPoint } from '../../entities';

export abstract class LoyaltyPointRepository {
  abstract save(loyaltyPoint: LoyaltyPoint): Promise<void>;
}
