import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ORDER_STATUSES } from '../../orders/dto/orders.dto';

export class AdminOrderQueryDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES, { message: 'وضعیت سفارش نامعتبر است' })
  status?: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class AdminReviewQueryDto {
  @IsOptional()
  @IsIn(['all', 'pending', 'approved'])
  status?: 'all' | 'pending' | 'approved';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
