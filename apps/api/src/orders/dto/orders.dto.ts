import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export class ShippingAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @Matches(/^\d{10}$/, { message: 'کد پستی باید ۱۰ رقم انگلیسی باشد' })
  postalCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @Matches(/^[+\d][\d\s-]{7,19}$/, { message: 'شماره تماس نامعتبر است' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @IsOptional()
  @IsBoolean()
  saveAddress?: boolean;

  @IsOptional()
  @IsString({ message: 'یادداشت نامعتبر است' })
  @MaxLength(1000)
  note?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES, { message: 'وضعیت سفارش نامعتبر است' })
  status!: (typeof ORDER_STATUSES)[number];
}
