import { IsUUID } from 'class-validator';

export class PayOrderInputDto {
  @IsUUID()
  orderUuid: string;

  @IsUUID()
  paymentMethodUuid: string;
}
