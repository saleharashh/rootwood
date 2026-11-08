import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    productId: string,
    userId: string,
    rating: number,
    title: string | undefined,
    body: string,
  ) {
    const [product, purchase] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: productId } }),
      this.prisma.order.findFirst({
        where: {
          userId,
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
          items: { some: { productId } },
        },
        select: { id: true },
      }),
    ]);

    if (!product || !product.isActive) {
      throw new NotFoundException('محصول مورد نظر پیدا نشد');
    }
    if (!purchase) {
      throw new ForbiddenException(
        'ثبت نظر فقط برای خریداران این محصول ممکن است',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });

    const data = {
      rating,
      title: title?.trim() || null,
      body: body.trim(),
      approved: false,
    };

    if (existing) {
      return this.prisma.review.update({
        where: { id: existing.id },
        data,
        include: { user: { select: { name: true, avatarUrl: true } } },
      });
    }

    return this.prisma.review.create({
      data: { ...data, productId, userId },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });
  }

  async listByProduct(productId: string, page = 1, limit = 20) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('محصول مورد نظر پیدا نشد');
    }

    const where = { productId, approved: true };
    const [reviews, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const count = aggregate._count._all;
    const average = Math.round((aggregate._avg.rating ?? 0) * 10) / 10;

    return {
      product: { id: product.id, name: product.name },
      rating: { average, count },
      reviews: reviews.map(({ user, ...review }) => ({ ...review, user })),
      page,
      limit,
      hasMore: page * limit < count,
    };
  }

  async listPending(page = 1, limit = 20) {
    const where = { approved: false };
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);
    return { items, total, page, limit, hasMore: page * limit < total };
  }

  async setApproval(id: string, approved: boolean) {
    const existing = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('نظر مورد نظر پیدا نشد');

    return this.prisma.review.update({
      where: { id },
      data: { approved },
      select: { id: true, approved: true, updatedAt: true },
    });
  }
}
