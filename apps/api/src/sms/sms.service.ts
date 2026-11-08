import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KavenegarResponse,
  SendSmsResult,
  SmsTemplateOptions,
} from './sms.types';

const KAVENEGAR_BASE_URL = 'https://api.kavenegar.com/v1';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly sender?: string;
  private readonly verifyTemplate: string;
  private readonly orderConfirmTemplate: string;
  private readonly orderStatusTemplate: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = (this.config.get<string>('KAVENEGAR_API_KEY') ?? '').trim();
    this.sender =
      (this.config.get<string>('KAVENEGAR_SENDER') ?? '').trim() || undefined;
    this.verifyTemplate =
      this.config.get<string>('KAVENEGAR_TEMPLATE_VERIFY') ??
      'craftedroot-verify';
    this.orderConfirmTemplate =
      this.config.get<string>('KAVENEGAR_TEMPLATE_ORDER_CONFIRM') ??
      'craftedroot-order-confirm';
    this.orderStatusTemplate =
      this.config.get<string>('KAVENEGAR_TEMPLATE_ORDER_STATUS') ??
      'craftedroot-order-status';
  }

  /**
   * Checks whether a real Kavenegar API key is configured.
   */
  isConfigured(): boolean {
    return Boolean(
      this.apiKey &&
      !this.apiKey.toLowerCase().startsWith('replace-') &&
      this.apiKey !== 'YOUR_KAVENEGAR_API_KEY',
    );
  }

  /**
   * Normalizes an Iranian mobile phone number to canonical 11-digit `09xxxxxxxxx` format.
   * Converts Persian/Arabic digits and strips international dialing prefixes.
   */
  normalizeIranianPhone(raw: string): string | null {
    if (!raw) return null;

    // Convert Persian & Arabic numbers to Latin digits
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    let cleaned = raw.trim();
    for (let i = 0; i < 10; i++) {
      cleaned = cleaned
        .replaceAll(persianDigits[i], String(i))
        .replaceAll(arabicDigits[i], String(i));
    }

    // Strip non-digit characters except leading plus
    cleaned = cleaned.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+98')) {
      cleaned = '0' + cleaned.slice(3);
    } else if (cleaned.startsWith('0098')) {
      cleaned = '0' + cleaned.slice(4);
    } else if (cleaned.startsWith('98') && cleaned.length === 12) {
      cleaned = '0' + cleaned.slice(2);
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
      cleaned = '0' + cleaned;
    }

    if (/^09\d{9}$/.test(cleaned)) {
      return cleaned;
    }

    return null;
  }

  /**
   * Sends an OTP code using Kavenegar's lookup pattern (خدماتی / اشتراکی).
   */
  async sendOtp(rawPhone: string, code: string): Promise<SendSmsResult> {
    const receptor = this.normalizeIranianPhone(rawPhone);
    if (!receptor) {
      this.logger.warn(
        `Invalid Iranian mobile phone number for OTP: "${rawPhone}"`,
      );
      return {
        success: false,
        error: 'شماره تلفن همراه واردشده نامعتبر است',
      };
    }

    return this.sendLookup({
      receptor,
      template: this.verifyTemplate,
      token: code,
    });
  }

  /**
   * Sends an order confirmation SMS.
   */
  async sendOrderConfirmation(
    rawPhone: string,
    orderNumber: string,
    customerName: string,
    totalToman: number,
  ): Promise<SendSmsResult> {
    const receptor = this.normalizeIranianPhone(rawPhone);
    if (!receptor) {
      this.logger.warn(`Invalid phone for order confirmation: "${rawPhone}"`);
      return { success: false, error: 'شماره همراه نامعتبر است' };
    }

    // Kavenegar lookup tokens cannot contain spaces
    const safeName = (customerName || 'مشتری').trim().replace(/\s+/g, '-');
    const safeTotal = String(totalToman);

    return this.sendLookup({
      receptor,
      template: this.orderConfirmTemplate,
      token: orderNumber,
      token2: safeName,
      token3: safeTotal,
    });
  }

  /**
   * Sends an order status update SMS (e.g. ارسال شد / تحویل داده شد).
   */
  async sendOrderStatusUpdate(
    rawPhone: string,
    orderNumber: string,
    statusText: string,
  ): Promise<SendSmsResult> {
    const receptor = this.normalizeIranianPhone(rawPhone);
    if (!receptor) {
      return { success: false, error: 'شماره همراه نامعتبر است' };
    }

    const safeStatus = statusText.trim().replace(/\s+/g, '-');

    return this.sendLookup({
      receptor,
      template: this.orderStatusTemplate,
      token: orderNumber,
      token2: safeStatus,
    });
  }

  /**
   * Sends a simple text SMS from a configured line.
   */
  async sendSimple(rawPhone: string, message: string): Promise<SendSmsResult> {
    const receptor = this.normalizeIranianPhone(rawPhone);
    if (!receptor) {
      return { success: false, error: 'شماره همراه نامعتبر است' };
    }

    if (!this.isConfigured()) {
      this.logger.log(
        `[Kavenegar SIMULATOR] Simple SMS to ${receptor}: "${message}"`,
      );
      return { success: true, simulated: true, messageId: 'simulated-simple' };
    }

    try {
      const url = `${KAVENEGAR_BASE_URL}/${this.apiKey}/sms/send.json`;
      const body = new URLSearchParams({
        receptor,
        message,
        ...(this.sender && { sender: this.sender }),
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(8000),
      });

      const data = (await res.json()) as KavenegarResponse;
      if (data.return?.status === 200) {
        const messageId = String(data.entries?.[0]?.messageid ?? '');
        this.logger.log(`Kavenegar SMS sent to ${receptor} (ID: ${messageId})`);
        return { success: true, messageId };
      }

      this.logger.error(
        `Kavenegar error ${data.return?.status}: ${data.return?.message}`,
      );
      return {
        success: false,
        error: data.return?.message ?? 'خطا در ارسال پیامک',
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Kavenegar simple send exception: ${msg}`);
      return { success: false, error: msg };
    }
  }

  /**
   * Internal helper to send via Kavenegar's Verify Lookup service.
   */
  private async sendLookup(
    options: SmsTemplateOptions,
  ): Promise<SendSmsResult> {
    const { receptor, template, token, token2, token3, token10, token20 } =
      options;

    // In simulation mode (e.g. dev without key or tests), log and return success
    if (!this.isConfigured()) {
      this.logger.log(
        `[Kavenegar SIMULATOR] Lookup [${template}] to ${receptor} -> token="${token}" token2="${token2 ?? ''}" token3="${token3 ?? ''}"`,
      );
      return {
        success: true,
        simulated: true,
        messageId: `sim-${Date.now()}`,
      };
    }

    try {
      const url = `${KAVENEGAR_BASE_URL}/${this.apiKey}/verify/lookup.json`;
      const params = new URLSearchParams({
        receptor,
        template,
        token,
        ...(token2 && { token2 }),
        ...(token3 && { token3 }),
        ...(token10 && { token10 }),
        ...(token20 && { token20 }),
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
        signal: AbortSignal.timeout(8000),
      });

      const data = (await res.json()) as KavenegarResponse;
      if (data.return?.status === 200) {
        const messageId = String(data.entries?.[0]?.messageid ?? '');
        this.logger.log(
          `Kavenegar Lookup [${template}] delivered to ${receptor} (ID: ${messageId})`,
        );
        return { success: true, messageId };
      }

      this.logger.error(
        `Kavenegar lookup error ${data.return?.status}: ${data.return?.message}`,
      );
      return {
        success: false,
        error: data.return?.message ?? 'خطا در وب‌سرویس پیامکی',
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Kavenegar lookup exception: ${msg}`);
      return { success: false, error: msg };
    }
  }
}
