import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { JwtPayload } from './auth.types';
import { OtpService } from './otp.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  SendOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto/auth.dto';

const SALT_ROUNDS = 10;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  'invalid-user-password',
  SALT_ROUNDS,
);

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly smsService: SmsService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
    private readonly config: ConfigService,
  ) {}

  /** Normalises a phone number or email into the key used for OTP storage. */
  private normalizeIdentifier(raw: string) {
    const trimmed = raw.trim();
    if (trimmed.includes('@')) {
      return { identifier: trimmed.toLowerCase(), isEmail: true as const };
    }
    return {
      identifier: trimmed.replace(/[^\d+]/g, ''),
      isEmail: false as const,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('حسابی با این ایمیل قبلاً ساخته شده است');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      },
    });

    return this.authResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    const valid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !valid) {
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');
    }

    return this.authResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
    if (!user) throw new NotFoundException('کاربر مورد نظر پیدا نشد');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() || null }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: publicUserSelect,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر مورد نظر پیدا نشد');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('رمز عبور فعلی نادرست است');
    }
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException(
        'رمز عبور جدید باید با رمز فعلی متفاوت باشد',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, SALT_ROUNDS),
        tokenVersion: { increment: 1 },
      },
    });

    return { success: true, ...this.authResponse(updated) };
  }

  async logout(userId?: string) {
    if (userId) {
      await this.prisma.user.updateMany({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      });
    }
    return { success: true };
  }

  async sendOtp(dto: SendOtpDto) {
    const { identifier, isEmail } = this.normalizeIdentifier(dto.identifier);

    if (!identifier) {
      throw new BadRequestException('شماره تماس یا ایمیل نامعتبر است');
    }

    const { code, expiresInSeconds } = await this.otpService.issue(identifier);

    let isSimulated = false;

    if (isEmail) {
      const sendResult = await this.mailService.sendOtp(identifier, code);
      if (!sendResult.success) {
        await this.otpService.revoke(identifier);
        throw new BadRequestException(
          sendResult.error ?? 'ارسال ایمیل تأیید با خطا مواجه شد',
        );
      }
      isSimulated = Boolean(sendResult.simulated);
    } else {
      const sendResult = await this.smsService.sendOtp(identifier, code);
      if (!sendResult.success && !sendResult.simulated) {
        await this.otpService.revoke(identifier);
        throw new BadRequestException(
          sendResult.error ??
            'ارسال پیامک با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
        );
      }
      isSimulated = Boolean(sendResult.simulated);
    }

    // The code may only be echoed back when the environment is explicitly
    // non-production AND delivery was simulated. A configured production
    // deployment never leaks a valid code through the API response.
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    if (isProduction && isSimulated) {
      await this.otpService.revoke(identifier);
      throw new BadRequestException(
        'سامانه ارسال کد تأیید هنوز پیکربندی نشده است. لطفاً با پشتیبانی تماس بگیرید.',
      );
    }
    const shouldReturnCode = !isProduction && isSimulated;

    return {
      success: true,
      message: `کد تأیید برای ${isEmail ? 'ایمیل' : 'شماره'} شما ارسال شد`,
      code: shouldReturnCode ? code : undefined,
      expiresInSeconds,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { identifier, isEmail } = this.normalizeIdentifier(dto.identifier);
    const code = dto.code.trim();

    const isValid = await this.otpService.consume(identifier, code);
    if (!isValid) {
      throw new BadRequestException('کد تأیید واردشده نادرست یا منقضی شده است');
    }

    let user = isEmail
      ? await this.prisma.user.findUnique({ where: { email: identifier } })
      : await this.prisma.user.findFirst({
          where: {
            OR: [
              { phone: identifier },
              { email: `${identifier}@craftedroot.local` },
            ],
          },
        });

    if (!user) {
      const generatedEmail = isEmail
        ? identifier
        : `${identifier}@craftedroot.local`;
      const fallbackName =
        dto.name?.trim() ||
        (isEmail ? identifier.split('@')[0] : `کاربر ${identifier.slice(-4)}`);

      user = await this.prisma.user.create({
        data: {
          email: generatedEmail,
          phone: isEmail ? null : identifier,
          name: fallbackName,
          passwordHash: await bcrypt.hash(
            `otp-user-${Date.now()}`,
            SALT_ROUNDS,
          ),
        },
      });
    }

    return this.authResponse(user);
  }

  private authResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken: this.jwt.sign(payload),
    };
  }
}
