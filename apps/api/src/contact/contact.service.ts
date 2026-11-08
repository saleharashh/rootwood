import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactStatusValue } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    name: string,
    email: string,
    phone?: string,
    subject?: string,
    message?: string,
    userId?: string,
  ) {
    const ticket = await this.prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        subject: subject?.trim() ?? '',
        message: message?.trim() ?? '',
        userId: userId ?? null,
      },
    });

    return { success: true, id: ticket.id };
  }

  async list(status?: ContactStatusValue, page = 1, limit = 20) {
    const where = status ? { status } : {};

    const [rows, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return { items: rows, total, page, limit, hasMore: page * limit < total };
  }

  async markStatus(id: string, status: ContactStatusValue) {
    const existing = await this.prisma.contactMessage.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('پیام مورد نظر پیدا نشد');

    return this.prisma.contactMessage.update({
      where: { id },
      data: { status },
      select: { id: true, subject: true, status: true },
    });
  }
}
