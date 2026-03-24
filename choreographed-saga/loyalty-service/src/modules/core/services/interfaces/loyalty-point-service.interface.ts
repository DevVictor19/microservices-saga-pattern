export interface CalcLoyaltyPointsInput {
  userUuid: string;
  orderUuid: string;
  totalPrice: number;
}

export abstract class LoyaltyPointService {
  abstract calcLoyaltyPoints(input: CalcLoyaltyPointsInput): Promise<void>;
}
