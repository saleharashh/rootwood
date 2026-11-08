import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../auth/auth.decorators';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  ReviewQueryDto,
  UpdateReviewApprovalDto,
} from './dto/reviews.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Roles('ADMIN')
  @Get('pending')
  listPending(@Query() query: ReviewQueryDto) {
    return this.reviews.listPending(query.page ?? 1, query.limit ?? 20);
  }

  @Public()
  @Get('product/:productId')
  listByProduct(
    @Param('productId') productId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviews.listByProduct(
      productId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Post('product/:productId')
  create(
    @Param('productId') productId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(
      productId,
      userId,
      dto.rating,
      dto.title,
      dto.body,
    );
  }

  @Roles('ADMIN')
  @Patch(':id/approval')
  setApproval(@Param('id') id: string, @Body() dto: UpdateReviewApprovalDto) {
    return this.reviews.setApproval(id, dto.approved);
  }
}
