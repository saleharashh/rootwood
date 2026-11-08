import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('reports a healthy service', async () => {
    await expect(appController.getHealth()).resolves.toMatchObject({
      status: 'ok',
      checks: { database: 'up' },
    });
  });

  it('rejects the health check when the database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    await expect(appController.getHealth()).rejects.toMatchObject({
      status: 503,
    });
  });
});
