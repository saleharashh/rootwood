import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PRODUCT_SORTS = [
  'newest',
  'price-asc',
  'price-desc',
  'rating',
  'name',
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  woodType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as unknown;
  })
  @IsBoolean({ message: 'مقدار featured باید true یا false باشد' })
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class CreateProductDto {
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(140) slug!: string;
  @IsOptional() @IsString() @MaxLength(160) tagline?: string;
  @IsString() description!: string;
  @IsInt() @Min(0) price!: number;
  @IsOptional() @IsInt() @Min(0) compareAt?: number;
  @IsString() @MaxLength(60) sku!: string;
  @IsInt() @Min(0) stock!: number;
  @IsString() categoryId!: string;
  @IsOptional() @IsString() @MaxLength(60) woodType?: string;
  @IsOptional() @IsString() @MaxLength(60) finish?: string;
  @IsOptional() @IsString() @MaxLength(80) dimensions?: string;
  @IsOptional() @IsNumber() @Min(0) weightKg?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString({ each: true }) images?: string[];
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(140) slug?: string;
  @IsOptional() @IsString() @MaxLength(160) tagline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(0) compareAt?: number;
  @IsOptional() @IsString() @MaxLength(60) sku?: string;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() @MaxLength(60) woodType?: string;
  @IsOptional() @IsString() @MaxLength(60) finish?: string;
  @IsOptional() @IsString() @MaxLength(80) dimensions?: string;
  @IsOptional() @IsNumber() @Min(0) weightKg?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString({ each: true }) images?: string[];
}

export class CreateCategoryDto {
  @IsString() @MaxLength(80) name!: string;
  @IsString() @MaxLength(80) slug!: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}
