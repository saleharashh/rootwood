import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/auth.decorators';
import { AdminService } from './admin.service';
import { AdminOrderQueryDto, AdminReviewQueryDto } from './dto/admin.dto';

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('summary')
  summary() {
    return this.admin.summary();
  }

  @Get('orders')
  orders(@Query() query: AdminOrderQueryDto) {
    return this.admin.listOrders(query);
  }

  @Get('reviews')
  reviews(@Query() query: AdminReviewQueryDto) {
    return this.admin.listReviews(query);
  }
}
