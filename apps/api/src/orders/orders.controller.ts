import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.orders.create(userId, dto);
  }

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.orders.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.orders.findOne(id, userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.orders.cancelForUser(id, userId);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto.status);
  }
}
