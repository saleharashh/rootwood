import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const CONTACT_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const;
export type ContactStatusValue = (typeof CONTACT_STATUSES)[number];

export class CreateContactDto {
  @IsString({ message: 'نام الزامی است' })
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(120, { message: 'نام باید حداکثر ۱۲۰ کاراکتر باشد' })
  name!: string;

  @IsEmail({}, { message: 'ایمیل معتبر الزامی است' })
  email!: string;

  @IsOptional()
  @IsString({ message: 'شماره تماس نامعتبر است' })
  @MaxLength(30, { message: 'شماره تماس باید حداکثر ۳۰ کاراکتر باشد' })
  phone?: string;

  @IsString({ message: 'موضوع الزامی است' })
  @MinLength(2, { message: 'موضوع باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(200, { message: 'موضوع باید حداکثر ۲۰۰ کاراکتر باشد' })
  subject!: string;

  @IsString({ message: 'متن پیام الزامی است' })
  @MinLength(2, { message: 'متن پیام باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(2000, { message: 'متن پیام باید حداکثر ۲۰۰۰ کاراکتر باشد' })
  message!: string;
}

export class ContactQueryDto {
  @IsOptional()
  @IsIn(CONTACT_STATUSES, { message: 'وضعیت پیام نامعتبر است' })
  status?: ContactStatusValue;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شماره صفحه نامعتبر است' })
  @Min(1, { message: 'شماره صفحه باید حداقل ۱ باشد' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'تعداد صفحه نامعتبر است' })
  @Min(1)
  @Max(50)
  limit?: number;
}

export class UpdateContactStatusDto {
  @IsIn(CONTACT_STATUSES, { message: 'وضعیت پیام نامعتبر است' })
  status!: ContactStatusValue;
}
