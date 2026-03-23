import { Payment, PaymentStatus } from '../../entities';

export abstract class PaymentRepository {
  abstract save(payment: Payment): Promise<Payment>;
  abstract updateStatus(id: number, status: PaymentStatus): Promise<void>;
  abstract findByUserOrderAndMethod(
    userUuid: string,
    orderUuid: string,
    paymentMethodUuid: string,
  ): Promise<Payment | null>;
}
