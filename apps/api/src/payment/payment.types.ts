export interface ZarinpalRequestResponse {
  data?: {
    code: number;
    message: string;
    authority: string;
    fee_type: string;
    fee: number;
  };
  errors?: unknown;
}

export interface ZarinpalVerifyResponse {
  data?: {
    code: number;
    message?: string;
    ref_id?: number | string;
    card_pan?: string;
    card_hash?: string;
    fee_type?: string;
    fee?: number;
  };
  errors?: unknown;
}

export interface ZibalRequestResponse {
  trackId: number;
  result: number;
  message: string;
}

export interface ZibalVerifyResponse {
  paidAt?: string;
  amount?: number;
  result: number;
  status?: number;
  refNumber?: number | string;
  description?: string;
  cardNumber?: string;
  message?: string;
}

export interface InitiatePaymentResult {
  paymentUrl: string;
  trackId: string;
  gateway: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  isSimulated: boolean;
}

export interface VerifyPaymentResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  refId?: string;
  cardPan?: string;
  paidAt?: Date;
  errorMessage?: string;
}

export interface GatewayInfo {
  id: string;
  name: string;
  logo: string;
  isLive: boolean;
  isConfigured: boolean;
  /** True when the gateway can accept a payment right now (live, sandbox or dev simulator). */
  isAvailable: boolean;
  description: string;
}
