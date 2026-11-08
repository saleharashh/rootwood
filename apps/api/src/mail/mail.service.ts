import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendMailResult {
  success: boolean;
  simulated?: boolean;
  error?: string;
}

/**
 * Minimal transactional email sender.
 *
 * Uses Resend's HTTP API so the API keeps a single runtime dependency and works
 * on any Node host. When credentials are absent the service reports itself as
 * unconfigured; callers decide whether that is acceptable (development) or a
 * hard failure (production).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly from: string;
  private readonly replyTo?: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = (this.config.get<string>('RESEND_API_KEY') ?? '').trim();
    this.from = (this.config.get<string>('MAIL_FROM') ?? '').trim();
    this.replyTo =
      (this.config.get<string>('MAIL_REPLY_TO') ?? '').trim() || undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.from);
  }

  async sendOtp(to: string, code: string): Promise<SendMailResult> {
    return this.send({
      to,
      subject: 'کد ورود یک‌بار مصرف Rootwood Group',
      text: [
        `کد ورود شما: ${code}`,
        '',
        'این کد تا دو دقیقه دیگر منقضی می‌شود و فقط یک بار قابل استفاده است.',
        'اگر شما این درخواست را نداده‌اید، این پیام را نادیده بگیرید.',
      ].join('\n'),
    });
  }

  async sendOrderConfirmation(
    to: string,
    input: {
      orderNumber: string;
      total: number;
      refId?: string;
      orderUrl: string;
    },
  ): Promise<SendMailResult> {
    return this.send({
      to,
      subject: `تأیید پرداخت سفارش ${input.orderNumber} — Rootwood Group`,
      text: [
        `پرداخت سفارش ${input.orderNumber} با موفقیت ثبت شد.`,
        `مبلغ: ${input.total.toLocaleString('fa-IR')} تومان`,
        input.refId ? `شماره پیگیری بانکی: ${input.refId}` : '',
        '',
        'سفارش شما برای آماده‌سازی به کارگاه ارسال شد.',
        `پیگیری سفارش: ${input.orderUrl}`,
        '',
        'از خرید شما سپاسگزاریم — Rootwood Group',
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  private async send(input: {
    to: string;
    subject: string;
    text: string;
  }): Promise<SendMailResult> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `Email delivery is not configured; skipped message to ${input.to}`,
      );
      return { success: true, simulated: true };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          ...(this.replyTo ? { reply_to: this.replyTo } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.error(
          `Email provider rejected message (${response.status}): ${detail.slice(0, 300)}`,
        );
        return {
          success: false,
          error: 'ارسال ایمیل تأیید با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
        };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Email delivery failed: ${message}`);
      return {
        success: false,
        error: 'ارسال ایمیل تأیید با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
      };
    }
  }
}
