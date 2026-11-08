import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { MailService } from '../mail/mail.service';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const mockOrder = {
    id: 'ord_123',
    orderNumber: 'CR-TEST-100',
    userId: 'usr_1',
    status: 'PENDING',
    total: 2_500_000,
    email: 'test@example.com',
    shippingAddress: { phone: '09121234567' },
    user: { phone: '09121234567', name: 'کاربر تستی' },
    paidAt: null,
    paymentRefId: null,
    paymentCardPan: null,
  };

  const mockTransaction = {
    id: 'tx_1',
    orderId: 'ord_123',
    gateway: 'simulated',
    amount: 2_500_000,
    status: 'PENDING',
    trackId: 'SIM_abc123',
    refId: null,
    cardPan: null,
    errorMessage: null,
    updatedAt: new Date('2026-11-08T10:00:00Z'),
    order: mockOrder,
  };

  const mockPrisma = {
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    paymentTransaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest
      .fn()
      .mockImplementation((callback) => callback(mockPrisma)),
  };

  const mockSms = {
    sendOrderStatusUpdate: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockMail = {
    sendOrderConfirmation: jest.fn().mockResolvedValue({ success: true }),
  };

  const baseConfig: Record<string, string> = {
    NODE_ENV: 'test',
    ZARINPAL_MERCHANT_ID: '',
    ZARINPAL_SANDBOX: 'true',
    ZIBAL_MERCHANT: '',
    ZIBAL_SANDBOX: 'true',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    PAYMENT_SIMULATION: 'false',
  };

  async function createService(
    overrides: Record<string, string> = {},
  ): Promise<PaymentService> {
    const config = { ...baseConfig, ...overrides };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmsService, useValue: mockSms },
        { provide: MailService, useValue: mockMail },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => config[key] },
        },
      ],
    }).compile();

    return module.get<PaymentService>(PaymentService);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback) =>
      callback(mockPrisma),
    );
  });

  describe('getGateways', () => {
    it('returns both real gateways without a simulated option', async () => {
      const service = await createService();
      const gateways = service.getGateways();
      expect(gateways.map((g) => g.id)).toEqual(['zarinpal', 'zibal']);
      expect(gateways.every((g) => g.isConfigured === false)).toBe(true);
    });
  });

  describe('initiatePayment', () => {
    it('refuses an unconfigured gateway instead of silently simulating', async () => {
      const service = await createService();
      mockPrisma.order.findFirst.mockResolvedValueOnce(mockOrder);

      await expect(
        service.initiatePayment('usr_1', {
          orderId: 'ord_123',
          gateway: 'zarinpal',
        }),
      ).rejects.toThrow('پیکربندی نشده');
      expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it('rejects the simulated gateway when simulation is disabled', async () => {
      const service = await createService();
      mockPrisma.order.findFirst.mockResolvedValueOnce(mockOrder);

      await expect(
        service.initiatePayment('usr_1', {
          orderId: 'ord_123',
          gateway: 'simulated',
        }),
      ).rejects.toThrow('درگاه شبیه‌سازی‌شده');
    });

    it('never enables simulation in production', async () => {
      const service = await createService({
        NODE_ENV: 'production',
        PAYMENT_SIMULATION: 'true',
      });
      mockPrisma.order.findFirst.mockResolvedValueOnce(mockOrder);

      await expect(
        service.initiatePayment('usr_1', {
          orderId: 'ord_123',
          gateway: 'simulated',
        }),
      ).rejects.toThrow('درگاه شبیه‌سازی‌شده');
    });

    it('creates a transaction and a signed callback in development', async () => {
      const service = await createService({ PAYMENT_SIMULATION: 'true' });
      mockPrisma.order.findFirst.mockResolvedValueOnce(mockOrder);
      mockPrisma.paymentTransaction.create.mockResolvedValueOnce(
        mockTransaction,
      );
      mockPrisma.order.update.mockResolvedValueOnce(mockOrder);

      const result = await service.initiatePayment('usr_1', {
        orderId: 'ord_123',
        gateway: 'simulated',
      });

      expect(result.orderId).toBe('ord_123');
      expect(result.isSimulated).toBe(true);
      expect(result.paymentUrl).toContain(
        'http://localhost:3000/checkout/callback',
      );
      expect(mockPrisma.paymentTransaction.create).toHaveBeenCalledTimes(1);
    });

    it('rejects payment if order is already paid', async () => {
      const service = await createService({ PAYMENT_SIMULATION: 'true' });
      mockPrisma.order.findFirst.mockResolvedValueOnce({
        ...mockOrder,
        status: 'PAID',
      });

      await expect(
        service.initiatePayment('usr_1', {
          orderId: 'ord_123',
          gateway: 'simulated',
        }),
      ).rejects.toThrow('این سفارش قبلاً پرداخت شده است');
    });
  });

  describe('verifyPayment', () => {
    it('returns the stored receipt for an idempotent success', async () => {
      const service = await createService({ PAYMENT_SIMULATION: 'true' });
      mockPrisma.paymentTransaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        status: 'SUCCESS',
        refId: 'SIM-REF',
        order: { ...mockOrder, status: 'PAID' },
      });

      const result = await service.verifyPayment('usr_1', {
        gateway: 'simulated',
        trackId: 'SIM_abc123',
      });

      expect(result.success).toBe(true);
      expect(result.refId).toBe('SIM-REF');
      expect(mockPrisma.paymentTransaction.updateMany).not.toHaveBeenCalled();
    });

    it('refuses a transaction whose amount differs from the order', async () => {
      const service = await createService({ PAYMENT_SIMULATION: 'true' });
      mockPrisma.paymentTransaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        amount: 100,
      });
      mockPrisma.paymentTransaction.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      await expect(
        service.verifyPayment('usr_1', {
          gateway: 'simulated',
          trackId: 'SIM_abc123',
        }),
      ).rejects.toThrow('هم‌خوانی ندارد');
      expect(mockPrisma.paymentTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
    });

    it('marks a cancelled Zarinpal payment as failed', async () => {
      const service = await createService();
      mockPrisma.paymentTransaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        gateway: 'zarinpal',
      });
      mockPrisma.paymentTransaction.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      const result = await service.verifyPayment('usr_1', {
        gateway: 'zarinpal',
        trackId: 'SIM_abc123',
        status: 'NOK',
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });

    it('transitions a simulated payment to PAID exactly once', async () => {
      const service = await createService({ PAYMENT_SIMULATION: 'true' });
      mockPrisma.paymentTransaction.findFirst.mockResolvedValueOnce(
        mockTransaction,
      );
      mockPrisma.paymentTransaction.updateMany.mockResolvedValueOnce({
        count: 1,
      });
      mockPrisma.order.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.verifyPayment('usr_1', {
        gateway: 'simulated',
        trackId: 'SIM_abc123',
      });

      expect(result.success).toBe(true);
      expect(result.refId).toBeDefined();
      expect(mockSms.sendOrderStatusUpdate).toHaveBeenCalled();
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_123', status: 'PENDING' },
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
    });
  });
});
