import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt({ message: 'امتیاز باید یک عدد باشد' })
  @Min(1, { message: 'امتیاز باید بین ۱ تا ۵ باشد' })
  @Max(5, { message: 'امتیاز باید بین ۱ تا ۵ باشد' })
  rating!: number;

  @IsOptional()
  @IsString({ message: 'عنوان نظر نامعتبر است' })
  @MaxLength(120, { message: 'عنوان نظر باید حداکثر ۱۲۰ کاراکتر باشد' })
  title?: string;

  @IsString({ message: 'متن نظر الزامی است' })
  @MinLength(2, { message: 'متن نظر باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(2000, { message: 'متن نظر باید حداکثر ۲۰۰۰ کاراکتر باشد' })
  body!: string;
}

export class ReviewQueryDto {
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

export class UpdateReviewApprovalDto {
  @IsBoolean()
  approved!: boolean;
}
