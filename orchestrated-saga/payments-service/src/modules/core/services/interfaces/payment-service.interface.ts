export interface ProcessPaymentInput {
  userUuid: string;
  orderUuid: string;
  paymentMethodUuid: string;
  totalPrice: number;
}

export abstract class PaymentService {
  abstract processPayment(input: ProcessPaymentInput): Promise<void>;
}
