import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import {
  GatewayInfo,
  InitiatePaymentResult,
  VerifyPaymentResult,
  ZarinpalRequestResponse,
  ZarinpalVerifyResponse,
  ZibalRequestResponse,
  ZibalVerifyResponse,
} from './payment.types';

/**
 * Order totals are stored in Toman. Iranian gateways expect Rial, so every
 * outbound amount is multiplied by this single constant. Keeping the
 * conversion here prevents the UI and the gateway from drifting apart.
 */
const TOMAN_TO_RIAL = 10;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly zarinpalMerchantId: string;
  private readonly zarinpalSandbox: boolean;
  private readonly zibalMerchant: string;
  private readonly zibalSandbox: boolean;
  private readonly siteUrl: string;
  private readonly allowSimulation: boolean;
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {
    this.zarinpalMerchantId = (
      this.config.get<string>('ZARINPAL_MERCHANT_ID') ?? ''
    ).trim();
    this.zarinpalSandbox =
      this.config.get<string>('ZARINPAL_SANDBOX') === 'true';
    this.zibalMerchant = (
      this.config.get<string>('ZIBAL_MERCHANT') ?? ''
    ).trim();
    this.zibalSandbox = this.config.get<string>('ZIBAL_SANDBOX') === 'true';
    this.siteUrl = (
      this.config.get<string>('NEXT_PUBLIC_SITE_URL') ??
      this.config.get<string>('SITE_URL') ??
      'http://localhost:3000'
    ).replace(/\/$/, '');
    this.isProduction = this.config.get<string>('NODE_ENV') === 'production';
    this.allowSimulation =
      !this.isProduction &&
      this.config.get<string>('PAYMENT_SIMULATION') === 'true';
  }

  /**
   * Returns the public gateway list. `isLive` tells the storefront whether the
   * gateway is configured for real money; `isConfigured` is true for sandbox
   * credentials as well.
   */
  getGateways(): GatewayInfo[] {
    return [
      {
        id: 'zarinpal',
        name: 'درگاه پرداخت زرین‌پال',
        logo: '/gateways/zarinpal.svg',
        isLive: this.isZarinpalLive(),
        isConfigured: this.isZarinpalConfigured(),
        isAvailable: this.isZarinpalConfigured() || this.allowSimulation,
        description: 'پرداخت امن با کلیه کارت‌های عضو شتاب از طریق زرین‌پال',
      },
      {
        id: 'zibal',
        name: 'درگاه پرداخت زیبال',
        logo: '/gateways/zibal.svg',
        isLive: this.isZibalLive(),
        isConfigured: this.isZibalConfigured(),
        isAvailable: this.isZibalConfigured() || this.allowSimulation,
        description: 'پرداخت سریع و مطمئن با کلیه کارت‌های بانکی از طریق زیبال',
      },
    ];
  }

  isZarinpalConfigured(): boolean {
    return Boolean(this.zarinpalMerchantId);
  }

  isZarinpalLive(): boolean {
    return Boolean(
      this.zarinpalMerchantId &&
      this.zarinpalMerchantId.length >= 30 &&
      !this.zarinpalSandbox,
    );
  }

  isZibalConfigured(): boolean {
    if (!this.zibalMerchant) return false;
    // The public "zibal" merchant is a sandbox merchant and must never be
    // treated as a live gateway in production.
    if (
      this.isProduction &&
      (this.zibalSandbox || this.zibalMerchant === 'zibal')
    ) {
      return false;
    }
    return true;
  }

  isZibalLive(): boolean {
    return Boolean(
      this.zibalMerchant &&
      this.zibalMerchant !== 'zibal' &&
      !this.zibalSandbox,
    );
  }

  /**
   * Initiates payment for an order with chosen gateway.
   */
  async initiatePayment(
    userId: string,
    dto: InitiatePaymentDto,
  ): Promise<InitiatePaymentResult> {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('سفارش مورد نظر پیدا نشد');
    }
    if (order.status === 'PAID') {
      throw new BadRequestException('این سفارش قبلاً پرداخت شده است');
    }
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('این سفارش لغو شده است و قابل پرداخت نیست');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException('وضعیت این سفارش اجازه پرداخت ندارد');
    }
    if (order.total <= 0) {
      throw new BadRequestException('مبلغ سفارش نامعتبر است');
    }

    if (dto.gateway === 'simulated' && !this.allowSimulation) {
      throw new BadRequestException(
        'درگاه شبیه‌سازی‌شده در این محیط فعال نیست',
      );
    }

    // The callback is always derived from the configured site origin. Client
    // supplied callback URLs are ignored to prevent open redirects and
    // phishing through the payment flow.
    const callbackUrl = `${this.siteUrl}/checkout/callback?gateway=${dto.gateway}`;

    let trackId: string;
    let paymentUrl: string;
    let isSimulated = false;

    if (dto.gateway === 'zarinpal' && this.isZarinpalConfigured()) {
      const result = await this.requestZarinpal(order, callbackUrl);
      trackId = result.authority;
      paymentUrl = this.zarinpalSandbox
        ? `https://sandbox.zarinpal.com/pg/StartPay/${trackId}`
        : `https://payment.zarinpal.com/pg/StartPay/${trackId}`;
    } else if (dto.gateway === 'zibal' && this.isZibalConfigured()) {
      const result = await this.requestZibal(order, callbackUrl);
      trackId = String(result.trackId);
      paymentUrl = `https://gateway.zibal.ir/start/${trackId}`;
    } else if (this.allowSimulation) {
      isSimulated = true;
      trackId = `SIM_${randomBytes(12).toString('hex')}`;
      const sep = callbackUrl.includes('?') ? '&' : '?';
      paymentUrl =
        dto.gateway === 'zarinpal'
          ? `${callbackUrl}${sep}Authority=${trackId}&Status=OK`
          : `${callbackUrl}${sep}trackId=${trackId}&success=1`;
      this.logger.warn(
        `[SIMULATED PAYMENT] Order ${order.orderNumber} via ${dto.gateway} (${trackId})`,
      );
    } else {
      throw new BadRequestException(
        dto.gateway === 'zarinpal'
          ? 'درگاه زرین‌پال پیکربندی نشده است. لطفاً درگاه دیگری انتخاب کنید.'
          : 'درگاه زیبال پیکربندی نشده است. لطفاً درگاه دیگری انتخاب کنید.',
      );
    }

    await this.prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        gateway: dto.gateway,
        amount: order.total,
        status: 'PENDING',
        trackId,
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentGateway: dto.gateway,
        paymentTrackId: trackId,
      },
    });

    return {
      paymentUrl,
      trackId,
      gateway: dto.gateway,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      isSimulated,
    };
  }

  /**
   * Verifies a completed payment callback. The gateway is always the source of
   * truth; query-string status flags are treated as hints only.
   */
  async verifyPayment(
    userId: string,
    dto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResult> {
    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: {
        trackId: dto.trackId,
        gateway: dto.gateway,
        order: { userId },
      },
      include: {
        order: {
          include: { user: { select: { name: true, phone: true } } },
        },
      },
    });

    if (!transaction) {
      // Returning the same 404 for "unknown" and "someone else's" avoids
      // leaking the existence of other customers' transactions.
      throw new NotFoundException('تراکنش پرداخت مربوطه پیدا نشد');
    }
    if (!transaction.trackId) {
      throw new NotFoundException('شناسه تراکنش پرداخت نامعتبر است');
    }

    const { order } = transaction;

    if (transaction.amount !== order.total) {
      await this.markTransactionFailed(
        transaction.id,
        'مبلغ تراکنش با مبلغ سفارش هم‌خوانی ندارد',
      );
      throw new BadRequestException('مبلغ تراکنش با مبلغ سفارش هم‌خوانی ندارد');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('این سفارش لغو شده است');
    }

    // Idempotency: repeat callbacks return the stored receipt.
    if (transaction.status === 'SUCCESS' || order.status === 'PAID') {
      return this.successReceipt(transaction, order);
    }

    if (transaction.status === 'FAILED') {
      return this.failureReceipt(
        order,
        transaction.errorMessage ?? 'این تراکنش قبلاً ناموفق ثبت شده است',
      );
    }

    let verifiedRefId: string;
    let verifiedCardPan: string | undefined;

    if (transaction.gateway === 'simulated') {
      if (!this.allowSimulation) {
        throw new BadRequestException(
          'درگاه شبیه‌سازی‌شده در این محیط فعال نیست',
        );
      }
      verifiedRefId = `SIM-${Date.now()}`;
      verifiedCardPan = '000000******0000';
    } else if (transaction.gateway === 'zarinpal') {
      if (dto.status !== 'OK') {
        await this.markTransactionFailed(
          transaction.id,
          'پرداخت توسط کاربر لغو شد یا در درگاه تایید نشد',
        );
        return this.failureReceipt(
          order,
          'پرداخت در درگاه زرین‌پال ناموفق بود یا لغو شد',
        );
      }

      const verifyResult = await this.verifyZarinpal(
        transaction.trackId,
        order.total,
      );
      verifiedRefId = String(verifyResult.refId);
      verifiedCardPan = verifyResult.cardPan;
    } else {
      // Zibal reports the outcome itself; `success=1` in the URL is ignored.
      const verifyResult = await this.verifyZibal(
        transaction.trackId,
        order.total,
      );
      verifiedRefId = String(verifyResult.refId);
      verifiedCardPan = verifyResult.cardPan;
    }

    const now = new Date();
    let transitioned = false;

    try {
      await this.prisma.$transaction(async (tx) => {
        const claim = await tx.paymentTransaction.updateMany({
          where: { id: transaction.id, status: 'PENDING' },
          data: {
            status: 'SUCCESS',
            refId: verifiedRefId,
            cardPan: verifiedCardPan ?? null,
          },
        });

        if (claim.count === 0) return;

        const orderUpdate = await tx.order.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: {
            status: 'PAID',
            paymentGateway: transaction.gateway,
            paymentRefId: verifiedRefId,
            paymentCardPan: verifiedCardPan ?? null,
            paidAt: now,
          },
        });

        if (orderUpdate.count === 0) {
          throw new BadRequestException(
            'وضعیت سفارش اجازه ثبت پرداخت را نمی‌دهد',
          );
        }

        transitioned = true;
      });
    } catch (error) {
      // A concurrent callback may have completed the transition already.
      const current = await this.prisma.paymentTransaction.findUnique({
        where: { id: transaction.id },
      });
      if (current?.status === 'SUCCESS') {
        return this.successReceipt(current, order);
      }
      throw error;
    }

    if (!transitioned) {
      const current = await this.prisma.paymentTransaction.findUnique({
        where: { id: transaction.id },
      });
      if (current?.status === 'SUCCESS') {
        return this.successReceipt(current, order);
      }
      return this.failureReceipt(
        order,
        current?.errorMessage ?? 'این تراکنش قابل تایید نیست',
      );
    }

    const phone =
      (order.shippingAddress as Record<string, string> | null)?.phone ||
      order.user?.phone;
    if (phone) {
      this.sms
        .sendOrderStatusUpdate(
          phone,
          order.orderNumber,
          'پرداخت با موفقیت انجام شد و در حال آماده‌سازی است',
        )
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Failed to send payment SMS: ${msg}`);
        });
    }

    if (order.email) {
      this.mail
        .sendOrderConfirmation(order.email, {
          orderNumber: order.orderNumber,
          total: order.total,
          refId: verifiedRefId,
          orderUrl: `${this.siteUrl}/order-confirmation?id=${order.id}`,
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Failed to send order confirmation email: ${msg}`);
        });
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      refId: verifiedRefId,
      cardPan: verifiedCardPan,
      paidAt: now,
    };
  }

  private successReceipt(
    transaction: {
      refId: string | null;
      cardPan: string | null;
      updatedAt: Date;
    },
    order: {
      id: string;
      orderNumber: string;
      total: number;
      paymentRefId?: string | null;
      paymentCardPan?: string | null;
      paidAt?: Date | null;
    },
  ): VerifyPaymentResult {
    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      refId: transaction.refId ?? order.paymentRefId ?? undefined,
      cardPan: transaction.cardPan ?? order.paymentCardPan ?? undefined,
      paidAt: order.paidAt ?? transaction.updatedAt,
    };
  }

  private failureReceipt(
    order: { id: string; orderNumber: string },
    errorMessage: string,
  ): VerifyPaymentResult {
    return {
      success: false,
      orderId: order.id,
      orderNumber: order.orderNumber,
      errorMessage,
    };
  }

  private async markTransactionFailed(
    transactionId: string,
    errorMessage: string,
  ) {
    await this.prisma.paymentTransaction.updateMany({
      where: { id: transactionId, status: 'PENDING' },
      data: {
        status: 'FAILED',
        errorMessage,
      },
    });
  }

  /**
   * Zarinpal v4 Payment Request
   */
  private async requestZarinpal(
    order: {
      orderNumber: string;
      total: number;
      email: string;
      user?: { phone?: string | null } | null;
    },
    callbackUrl: string,
  ): Promise<{ authority: string }> {
    const url = this.zarinpalSandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
      : 'https://payment.zarinpal.com/pg/v4/payment/request.json';

    const body = {
      merchant_id: this.zarinpalMerchantId,
      amount: order.total * TOMAN_TO_RIAL,
      currency: 'IRR',
      description: `خرید از فروشگاه کرفتدرات - سفارش ${order.orderNumber}`,
      callback_url: callbackUrl,
      metadata: {
        email: order.email,
        mobile: order.user?.phone || undefined,
        order_id: order.orderNumber,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await res.json()) as ZarinpalRequestResponse;
    if (data.data?.code === 100 && data.data.authority) {
      return { authority: data.data.authority };
    }

    this.logger.error(
      `Zarinpal request failed: code ${data.data?.code ?? 'unknown'}, errors: ${JSON.stringify(data.errors)}`,
    );
    throw new BadRequestException('ارتباط با درگاه زرین‌پال برقرار نشد');
  }

  /**
   * Zarinpal v4 Payment Verification
   */
  private async verifyZarinpal(
    authority: string,
    totalToman: number,
  ): Promise<{ refId: string | number; cardPan?: string }> {
    const url = this.zarinpalSandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
      : 'https://payment.zarinpal.com/pg/v4/payment/verify.json';

    const body = {
      merchant_id: this.zarinpalMerchantId,
      amount: totalToman * TOMAN_TO_RIAL,
      authority,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await res.json()) as ZarinpalVerifyResponse;
    if (
      (data.data?.code === 100 || data.data?.code === 101) &&
      data.data.ref_id
    ) {
      return {
        refId: data.data.ref_id,
        cardPan: data.data.card_pan,
      };
    }

    this.logger.error(`Zarinpal verification failed: ${JSON.stringify(data)}`);
    throw new BadRequestException('تأیید تراکنش در درگاه زرین‌پال ناموفق بود');
  }

  /**
   * Zibal Payment Request
   */
  private async requestZibal(
    order: {
      orderNumber: string;
      total: number;
      user?: { phone?: string | null } | null;
    },
    callbackUrl: string,
  ): Promise<{ trackId: number }> {
    const url = 'https://gateway.zibal.ir/v1/request';

    const body = {
      merchant: this.zibalMerchant,
      amount: order.total * TOMAN_TO_RIAL,
      callbackUrl,
      description: `خرید از کرفتدرات - سفارش ${order.orderNumber}`,
      orderId: order.orderNumber,
      mobile: order.user?.phone || undefined,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await res.json()) as ZibalRequestResponse;
    if (data.result === 100 && data.trackId) {
      return { trackId: data.trackId };
    }

    this.logger.error(
      `Zibal request failed: result ${data.result}, message: ${data.message}`,
    );
    throw new BadRequestException('ارتباط با درگاه زیبال برقرار نشد');
  }

  /**
   * Zibal Payment Verification. Zibal is the source of truth: result 100 is a
   * fresh success and 201 means the transaction was already verified.
   */
  private async verifyZibal(
    trackId: string,
    totalToman: number,
  ): Promise<{ refId: string | number; cardPan?: string }> {
    const url = 'https://gateway.zibal.ir/v1/verify';

    const body = {
      merchant: this.zibalMerchant,
      trackId: Number(trackId),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await res.json()) as ZibalVerifyResponse;

    if (
      typeof data.amount === 'number' &&
      data.amount !== totalToman * TOMAN_TO_RIAL
    ) {
      this.logger.error(
        `Zibal amount mismatch for track ${trackId}: expected ${totalToman * TOMAN_TO_RIAL}, got ${data.amount}`,
      );
      throw new BadRequestException(
        'مبلغ تاییدشده در درگاه با سفارش هم‌خوانی ندارد',
      );
    }

    if ((data.result === 100 || data.result === 201) && data.refNumber) {
      return {
        refId: data.refNumber,
        cardPan: data.cardNumber,
      };
    }

    this.logger.error(`Zibal verify failed: ${JSON.stringify(data)}`);
    throw new BadRequestException('تأیید تراکنش در درگاه زیبال ناموفق بود');
  }
}
