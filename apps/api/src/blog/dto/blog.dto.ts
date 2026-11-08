import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class BlogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شماره صفحه نامعتبر است' })
  @Min(1, { message: 'شماره صفحه باید حداقل ۱ باشد' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
