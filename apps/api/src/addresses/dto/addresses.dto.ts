import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString({ message: 'نام و نام خانوادگی الزامی است' })
  @MinLength(2, { message: 'نام و نام خانوادگی الزامی است' })
  @MaxLength(120, {
    message: 'نام و نام خانوادگی باید حداکثر ۱۲۰ کاراکتر باشد',
  })
  fullName!: string;

  @IsString({ message: 'نشانی الزامی است' })
  @MinLength(3, { message: 'نشانی الزامی است' })
  @MaxLength(200, { message: 'نشانی باید حداکثر ۲۰۰ کاراکتر باشد' })
  line1!: string;

  @IsOptional()
  @IsString({ message: 'نشانی نامعتبر است' })
  @MaxLength(200, { message: 'نشانی باید حداکثر ۲۰۰ کاراکتر باشد' })
  line2?: string;

  @IsString({ message: 'شهر الزامی است' })
  @MinLength(2, { message: 'شهر الزامی است' })
  @MaxLength(120, { message: 'شهر باید حداکثر ۱۲۰ کاراکتر باشد' })
  city!: string;

  @IsOptional()
  @IsString({ message: 'استان نامعتبر است' })
  @MaxLength(80, { message: 'استان باید حداکثر ۸۰ کاراکتر باشد' })
  state?: string;

  @Matches(/^\d{10}$/, { message: 'کد پستی باید ۱۰ رقم انگلیسی باشد' })
  postalCode!: string;

  @IsOptional()
  @IsString({ message: 'کشور نامعتبر است' })
  @MaxLength(3, { message: 'کشور باید حداکثر ۳ کاراکتر باشد' })
  country?: string;

  @IsOptional()
  @Matches(/^[+\d][\d\s-]{7,19}$/, { message: 'شماره تماس نامعتبر است' })
  phone?: string;

  @IsOptional()
  @IsBoolean({ message: 'مقدار پیش‌فرض نامعتبر است' })
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString({ message: 'نام و نام خانوادگی نامعتبر است' })
  @MaxLength(120, {
    message: 'نام و نام خانوادگی باید حداکثر ۱۲۰ کاراکتر باشد',
  })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'نشانی نامعتبر است' })
  @MaxLength(200, { message: 'نشانی باید حداکثر ۲۰۰ کاراکتر باشد' })
  line1?: string;

  @IsOptional()
  @IsString({ message: 'نشانی نامعتبر است' })
  @MaxLength(200, { message: 'نشانی باید حداکثر ۲۰۰ کاراکتر باشد' })
  line2?: string;

  @IsOptional()
  @IsString({ message: 'شهر نامعتبر است' })
  @MaxLength(120, { message: 'شهر باید حداکثر ۱۲۰ کاراکتر باشد' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'استان نامعتبر است' })
  @MaxLength(80, { message: 'استان باید حداکثر ۸۰ کاراکتر باشد' })
  state?: string;

  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'کد پستی باید ۱۰ رقم انگلیسی باشد' })
  postalCode?: string;

  @IsOptional()
  @IsString({ message: 'کشور نامعتبر است' })
  @MaxLength(3, { message: 'کشور باید حداکثر ۳ کاراکتر باشد' })
  country?: string;

  @IsOptional()
  @Matches(/^[+\d][\d\s-]{7,19}$/, { message: 'شماره تماس نامعتبر است' })
  phone?: string;

  @IsOptional()
  @IsBoolean({ message: 'مقدار پیش‌فرض نامعتبر است' })
  isDefault?: boolean;
}
