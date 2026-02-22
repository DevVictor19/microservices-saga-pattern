import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OrderService } from '../services';
import { PayOrderInputDto } from './dtos';

@Controller({
  version: '1',
  path: 'orders',
})
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Post('payments')
  @HttpCode(HttpStatus.ACCEPTED)
  async payOrder(@Body() body: PayOrderInputDto): Promise<void> {
    await this.orderService.prepareOrderForPayment(
      body.orderUuid,
      body.paymentMethodUuid,
    );
  }
}
