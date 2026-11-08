import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OTP_MAX_ATTEMPTS, OtpService } from './otp.service';

describe('OtpService', () => {
  const created: Array<Record<string, unknown>> = [];

  const mockPrisma = {
    otpCode: {
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  async function createService(): Promise<OtpService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'OTP_SECRET'
                ? 'test-otp-secret-with-enough-entropy'
                : undefined,
          },
        },
      ],
    }).compile();

    return module.get<OtpService>(OtpService);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    created.length = 0;
    mockPrisma.otpCode.count.mockResolvedValue(0);
    mockPrisma.otpCode.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.otpCode.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return Promise.resolve({ id: 'otp_1', ...data });
      },
    );
    mockPrisma.$transaction.mockImplementation(
      (operations: Promise<unknown>[]) => Promise.all(operations),
    );
  });

  it('issues a six-digit code and stores only its digest', async () => {
    const service = await createService();

    const result = await service.issue('09121234567');

    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.expiresInSeconds).toBe(120);
    expect(created).toHaveLength(1);
    expect(created[0].codeHash).not.toContain(result.code);
    expect(created[0].attempts ?? 0).toBe(0);
    expect(mockPrisma.otpCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { identifier: '09121234567', consumedAt: null },
      }),
    );
  });

  it('rate limits repeated code requests per identifier', async () => {
    const service = await createService();
    mockPrisma.otpCode.count.mockResolvedValueOnce(5);

    await expect(service.issue('09121234567')).rejects.toThrow(
      'بیش از حد مجاز',
    );
    expect(mockPrisma.otpCode.create).not.toHaveBeenCalled();
  });

  it('accepts the correct code once and marks it consumed', async () => {
    const service = await createService();
    const { code } = await service.issue('09121234567');
    mockPrisma.otpCode.findFirst.mockResolvedValueOnce({
      id: 'otp_1',
      attempts: 0,
      codeHash: created[0].codeHash,
    });

    await expect(service.consume('09121234567', code)).resolves.toBe(true);
    expect(mockPrisma.otpCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'otp_1' },
        data: expect.objectContaining({ consumedAt: expect.any(Date) }),
      }),
    );
  });

  it('increments the attempt counter for a wrong code', async () => {
    const service = await createService();
    await service.issue('09121234567');
    mockPrisma.otpCode.findFirst.mockResolvedValueOnce({
      id: 'otp_1',
      attempts: 1,
      codeHash: created[0].codeHash,
    });

    await expect(service.consume('09121234567', '000000')).resolves.toBe(false);
    expect(mockPrisma.otpCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ attempts: 2 }),
      }),
    );
  });

  it('burns a code after the attempt budget is exhausted', async () => {
    const service = await createService();
    await service.issue('09121234567');
    mockPrisma.otpCode.findFirst.mockResolvedValueOnce({
      id: 'otp_1',
      attempts: OTP_MAX_ATTEMPTS,
      codeHash: created[0].codeHash,
    });

    await expect(service.consume('09121234567', '000000')).resolves.toBe(false);
    expect(mockPrisma.otpCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ consumedAt: expect.any(Date) }),
      }),
    );
  });
});
