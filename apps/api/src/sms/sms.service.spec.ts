import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  let service: SmsService;
  const mockConfig: Record<string, string> = {
    KAVENEGAR_API_KEY: '',
    KAVENEGAR_TEMPLATE_VERIFY: 'craftedroot-verify',
    KAVENEGAR_TEMPLATE_ORDER_CONFIRM: 'craftedroot-order-confirm',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => mockConfig[key],
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  describe('normalizeIranianPhone', () => {
    it('normalizes standard 0912 number', () => {
      expect(service.normalizeIranianPhone('09123456789')).toBe('09123456789');
    });

    it('normalizes +98 format', () => {
      expect(service.normalizeIranianPhone('+989123456789')).toBe(
        '09123456789',
      );
    });

    it('normalizes 0098 format', () => {
      expect(service.normalizeIranianPhone('00989123456789')).toBe(
        '09123456789',
      );
    });

    it('normalizes 989 format', () => {
      expect(service.normalizeIranianPhone('989123456789')).toBe('09123456789');
    });

    it('normalizes 912 format without leading zero', () => {
      expect(service.normalizeIranianPhone('9123456789')).toBe('09123456789');
    });

    it('converts Persian digits correctly', () => {
      expect(service.normalizeIranianPhone('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
    });

    it('strips dashes and whitespace', () => {
      expect(service.normalizeIranianPhone(' 0912-345 6789 ')).toBe(
        '09123456789',
      );
    });

    it('rejects invalid numbers', () => {
      expect(service.normalizeIranianPhone('02188888888')).toBeNull();
      expect(service.normalizeIranianPhone('12345')).toBeNull();
      expect(service.normalizeIranianPhone('abc')).toBeNull();
    });
  });

  describe('simulation mode', () => {
    it('reports unconfigured when API key is empty', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('simulates OTP sending without real HTTP request', async () => {
      const result = await service.sendOtp('09123456789', '54321');
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });

    it('simulates order confirmation without real HTTP request', async () => {
      const result = await service.sendOrderConfirmation(
        '09123456789',
        'CR-1001',
        'رضا محمدی',
        1_200_000,
      );
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });
});
