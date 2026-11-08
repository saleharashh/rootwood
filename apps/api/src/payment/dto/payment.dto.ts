import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Gateways that can settle real money. */
export const LIVE_GATEWAYS = ['zarinpal', 'zibal'] as const;

/**
 * Development-only gateway. It is rejected unless `PAYMENT_SIMULATION=true`
 * and `NODE_ENV !== "production"`, so a production deployment can never mark
 * an order as paid without contacting a real gateway.
 */
export const SIMULATED_GATEWAY = 'simulated';

export const SUPPORTED_GATEWAYS = [
  ...LIVE_GATEWAYS,
  SIMULATED_GATEWAY,
] as const;

export type PaymentGatewayType = (typeof SUPPORTED_GATEWAYS)[number];

export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsIn(SUPPORTED_GATEWAYS, {
    message: 'درگاه پرداخت انتخابی معتبر نیست (zarinpal یا zibal)',
  })
  gateway!: PaymentGatewayType;
}

export class VerifyPaymentDto {
  @IsIn(SUPPORTED_GATEWAYS)
  gateway!: PaymentGatewayType;

  @IsString()
  @IsNotEmpty()
  trackId!: string;

  /**
   * Gateway-specific status hint. It is never trusted on its own: the API
   * always confirms the transaction with the gateway before marking an order
   * as paid.
   */
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  success?: string;
}
