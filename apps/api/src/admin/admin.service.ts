import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminOrderQueryDto, AdminReviewQueryDto } from './dto/admin.dto';

const REVENUE_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED'] as const;
const LOW_STOCK_THRESHOLD = 8;
const DAY_MS = 86_400_000;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const since = new Date(Date.now() - 6 * DAY_MS);
    since.setHours(0, 0, 0, 0);

    const [
      revenue,
      orderGroups,
      pendingReviews,
      newTickets,
      customers,
      products,
      lowStock,
      recentOrders,
      recentSales,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: { in: [...REVENUE_STATUSES] } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.review.count({ where: { approved: false } }),
      this.prisma.contactMessage.count({ where: { status: 'NEW' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.findMany({
        where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        select: {
          id: true,
          name: true,
          slug: true,
          stock: true,
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
            select: { url: true, alt: true },
          },
        },
        orderBy: { stock: 'asc' },
        take: 5,
      }),
      this.prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          email: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.order.findMany({
        where: {
          status: { in: [...REVENUE_STATUSES] },
          createdAt: { gte: since },
        },
        select: { total: true, createdAt: true },
      }),
    ]);

    const ordersByStatus = {
      PENDING: 0,
      PAID: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const group of orderGroups) {
      ordersByStatus[group.status] = group._count._all;
    }

    const salesByDay = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(since.getTime() + index * DAY_MS);
      return { date: day.toISOString().slice(0, 10), total: 0, orders: 0 };
    });
    for (const order of recentSales) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const bucket = salesByDay.find((entry) => entry.date === key);
      if (bucket) {
        bucket.total += order.total;
        bucket.orders += 1;
      }
    }

    return {
      revenue: revenue._sum.total ?? 0,
      paidOrders: revenue._count._all,
      pendingReviews,
      newTickets,
      customers,
      products,
      ordersByStatus,
      salesByDay,
      lowStock: lowStock.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        stock: product.stock,
        image: product.images[0]?.url ?? null,
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name ?? 'مهمان',
        email: order.email,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
      })),
    };
  }

  async listOrders(query: AdminOrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              {
                orderNumber: { contains: search, mode: 'insensitive' as const },
              },
              { email: { contains: search, mode: 'insensitive' as const } },
              {
                user: {
                  is: {
                    name: { contains: search, mode: 'insensitive' as const },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          email: true,
          status: true,
          subtotal: true,
          shipping: true,
          total: true,
          note: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: rows.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name ?? 'مهمان',
        email: order.user?.email ?? order.email,
        status: order.status,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        note: order.note,
        itemCount: order._count.items,
        createdAt: order.createdAt,
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async listReviews(query: AdminReviewQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReviewWhereInput =
      query.status === 'pending'
        ? { approved: false }
        : query.status === 'approved'
          ? { approved: true }
          : {};

    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                take: 1,
                orderBy: { sortOrder: 'asc' },
                select: { url: true, alt: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: rows.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        approved: review.approved,
        createdAt: review.createdAt,
        user: review.user,
        product: {
          id: review.product.id,
          name: review.product.name,
          slug: review.product.slug,
          image: review.product.images[0]?.url ?? null,
        },
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }
}
