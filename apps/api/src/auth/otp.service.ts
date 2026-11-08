import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

/** Codes live for two minutes, matching the copy shown in the auth dialog. */
export const OTP_TTL_SECONDS = 120;
/** A code can be tried at most five times before it is burned. */
export const OTP_MAX_ATTEMPTS = 5;
/** At most five codes may be requested per identifier in this window. */
const OTP_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_SENDS = 5;

export interface IssuedOtp {
  code: string;
  expiresInSeconds: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const secret =
      config.get<string>('OTP_SECRET')?.trim() ||
      config.get<string>('JWT_SECRET')?.trim();
    if (!secret) {
      throw new Error('OTP_SECRET or JWT_SECRET must be configured');
    }
    this.secret = secret;
  }

  /**
   * Generates a cryptographically secure six-digit code and persists only its
   * digest. Any previous unconsumed code for the identifier is revoked so a
   * resend invalidates the old code.
   */
  async issue(identifier: string): Promise<IssuedOtp> {
    const windowStart = new Date(Date.now() - OTP_WINDOW_MS);
    const recent = await this.prisma.otpCode.count({
      where: { identifier, createdAt: { gte: windowStart } },
    });
    if (recent >= OTP_MAX_SENDS) {
      throw new HttpException(
        'تعداد درخواست کد تأیید بیش از حد مجاز است؛ چند دقیقه دیگر تلاش کنید',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(100_000, 1_000_000));
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.otpCode.updateMany({
        where: { identifier, consumedAt: null },
        data: { consumedAt: now },
      }),
      this.prisma.otpCode.create({
        data: {
          identifier,
          codeHash: this.hash(identifier, code),
          expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
        },
      }),
    ]);

    return { code, expiresInSeconds: OTP_TTL_SECONDS };
  }

  /**
   * Verifies a code exactly once. Wrong guesses increment an attempt counter;
   * once the budget is exhausted the code is burned, which makes brute forcing
   * a six-digit code infeasible.
   */
  async consume(identifier: string, code: string): Promise<boolean> {
    const entry = await this.prisma.otpCode.findFirst({
      where: {
        identifier,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!entry) return false;

    if (entry.attempts >= OTP_MAX_ATTEMPTS) {
      await this.prisma.otpCode.update({
        where: { id: entry.id },
        data: { consumedAt: new Date() },
      });
      return false;
    }

    if (!this.matches(entry.codeHash, this.hash(identifier, code))) {
      const attempts = entry.attempts + 1;
      await this.prisma.otpCode.update({
        where: { id: entry.id },
        data: {
          attempts,
          ...(attempts >= OTP_MAX_ATTEMPTS ? { consumedAt: new Date() } : {}),
        },
      });
      this.logger.warn(
        `Rejected OTP attempt ${attempts}/${OTP_MAX_ATTEMPTS} for ${identifier}`,
      );
      return false;
    }

    await this.prisma.otpCode.update({
      where: { id: entry.id },
      data: { consumedAt: new Date() },
    });
    return true;
  }

  /** Revokes the active code when delivery fails, so it cannot be replayed. */
  async revoke(identifier: string): Promise<void> {
    await this.prisma.otpCode.updateMany({
      where: { identifier, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  private hash(identifier: string, code: string): string {
    return createHmac('sha256', this.secret)
      .update(`${identifier}:${code}`)
      .digest('hex');
  }

  private matches(storedHex: string, candidateHex: string): boolean {
    const stored = Buffer.from(storedHex, 'hex');
    const candidate = Buffer.from(candidateHex, 'hex');
    if (stored.length !== candidate.length) return false;
    return timingSafeEqual(stored, candidate);
  }
}
