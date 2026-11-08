import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'ایمیل معتبر الزامی است' })
  email!: string;

  @IsString({ message: 'رمز عبور الزامی است' })
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  @MaxLength(72, { message: 'رمز عبور باید حداکثر ۷۲ کاراکتر باشد' })
  password!: string;

  @IsString({ message: 'نام الزامی است' })
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(80, { message: 'نام باید حداکثر ۸۰ کاراکتر باشد' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'شماره تماس نامعتبر است' })
  @MaxLength(20, { message: 'شماره تماس باید حداکثر ۲۰ کاراکتر باشد' })
  phone?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'ایمیل معتبر الزامی است' })
  email!: string;

  @IsString({ message: 'رمز عبور الزامی است' })
  @MinLength(1, { message: 'رمز عبور الزامی است' })
  password!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'نام نامعتبر است' })
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(80, { message: 'نام باید حداکثر ۸۰ کاراکتر باشد' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'شماره تماس نامعتبر است' })
  @MaxLength(20, { message: 'شماره تماس باید حداکثر ۲۰ کاراکتر باشد' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'نشانی تصویر پروفایل نامعتبر است' })
  @MaxLength(500, {
    message: 'نشانی تصویر پروفایل باید حداکثر ۵۰۰ کاراکتر باشد',
  })
  avatarUrl?: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'رمز عبور فعلی الزامی است' })
  @MinLength(1, { message: 'رمز عبور فعلی الزامی است' })
  currentPassword!: string;

  @IsString({ message: 'رمز عبور جدید الزامی است' })
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  @MaxLength(72, { message: 'رمز عبور باید حداکثر ۷۲ کاراکتر باشد' })
  newPassword!: string;
}

export class SendOtpDto {
  @IsString({ message: 'شماره موبایل یا ایمیل الزامی است' })
  @MinLength(3, { message: 'شماره موبایل یا ایمیل نامعتبر است' })
  @MaxLength(100, { message: 'شناسه بیش از حد طولانی است' })
  identifier!: string;
}

export class VerifyOtpDto {
  @IsString({ message: 'شماره موبایل یا ایمیل الزامی است' })
  @MinLength(3, { message: 'شماره موبایل یا ایمیل نامعتبر است' })
  @MaxLength(100, { message: 'شناسه بیش از حد طولانی است' })
  identifier!: string;

  @IsString({ message: 'کد تأیید الزامی است' })
  @MinLength(4, { message: 'کد تأیید باید حداقل ۴ رقم باشد' })
  @MaxLength(8, { message: 'کد تأیید نامعتبر است' })
  code!: string;

  @IsOptional()
  @IsString({ message: 'نام نامعتبر است' })
  @MaxLength(80)
  name?: string;
}
