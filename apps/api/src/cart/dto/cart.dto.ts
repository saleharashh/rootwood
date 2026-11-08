import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AddToCartDto {
  @IsString({ message: 'شناسه محصول الزامی است' })
  productId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'تعداد باید یک عدد صحیح باشد' })
  @Min(1, { message: 'تعداد باید حداقل ۱ باشد' })
  @Max(99, { message: 'تعداد باید حداکثر ۹۹ باشد' })
  quantity?: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt({ message: 'تعداد باید یک عدد صحیح باشد' })
  @Min(1, { message: 'تعداد باید حداقل ۱ باشد' })
  @Max(99, { message: 'تعداد باید حداکثر ۹۹ باشد' })
  quantity!: number;
}

export class MergeCartDto {
  @IsString({ message: 'شناسه نشست نامعتبر است' })
  @MinLength(16)
  @MaxLength(80)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'شناسه نشست نامعتبر است' })
  sessionId!: string;
}
