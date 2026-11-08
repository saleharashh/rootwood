import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, Public } from '../auth/auth.decorators';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Get('gateways')
  getGateways() {
    return this.paymentService.getGateways();
  }

  @Post('initiate')
  initiate(@CurrentUser('id') userId: string, @Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(userId, dto);
  }

  @Post('verify')
  verify(@CurrentUser('id') userId: string, @Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(userId, dto);
  }
}
