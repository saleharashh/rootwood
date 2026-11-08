import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderExpiryService } from './order-expiry.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SmsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpiryService],
  exports: [OrdersService],
})
export class OrdersModule {}
