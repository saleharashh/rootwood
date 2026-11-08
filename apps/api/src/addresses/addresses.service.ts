import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { fullName: 'asc' }],
    });
  }

  async create(
    userId: string,
    dto: {
      fullName: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country?: string;
      phone?: string;
      isDefault?: boolean;
    },
  ) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        fullName: dto.fullName.trim(),
        line1: dto.line1.trim(),
        line2: dto.line2?.trim() || null,
        city: dto.city.trim(),
        state: dto.state?.trim() || null,
        postalCode: dto.postalCode.trim(),
        country: dto.country ?? 'IR',
        phone: dto.phone?.trim() || null,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    dto: {
      fullName?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      phone?: string;
      isDefault?: boolean;
    },
  ) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existing) throw new NotFoundException('آدرس مورد نظر پیدا نشد');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.line1 !== undefined && { line1: dto.line1.trim() }),
        ...(dto.line2 !== undefined && { line2: dto.line2?.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city.trim() }),
        ...(dto.state !== undefined && { state: dto.state?.trim() || null }),
        ...(dto.postalCode !== undefined && {
          postalCode: dto.postalCode.trim(),
        }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existing) throw new NotFoundException('آدرس مورد نظر پیدا نشد');

    await this.prisma.address.delete({ where: { id } });

    return { success: true };
  }
}
