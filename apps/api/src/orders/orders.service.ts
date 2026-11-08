import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';

const FREE_SHIPPING_THRESHOLD = 5_000_000;
const SHIPPING_FLAT = 250_000;

const orderInclude = {
  items: {
    include: {
      product: {
        select: { images: { take: 1, orderBy: { sortOrder: 'asc' as const } } },
      },
    },
  },
  user: { select: { name: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type OrderStatusValue = UpdateOrderStatusDto['status'];

const ALLOWED_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_LABELS: Record<OrderStatusValue, string> = {
  PENDING: 'در انتظار پرداخت',
  PAID: 'پرداخت شد و در حال آماده‌سازی است',
  SHIPPED: 'تحویل پست و باربری شد',
  DELIVERED: 'تحویل داده شد',
  CANCELLED: 'لغو شد',
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const order = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true, name: true },
      });
      if (!user) throw new NotFoundException('کاربر مورد نظر پیدا نشد');

      const cartItems = await tx.cartItem.findMany({
        where: { cart: { userId } },
        include: { product: true },
        orderBy: { id: 'asc' },
      });
      if (cartItems.length === 0) {
        throw new BadRequestException('سبد خرید شما خالی است');
      }

      let subtotal = 0;
      const orderItems: {
        productId: string;
        name: string;
        unitPrice: number;
        quantity: number;
      }[] = [];

      for (const item of cartItems) {
        if (!item.product.isActive) {
          throw new BadRequestException(
            `محصول «${item.product.name}» دیگر فعال نیست`,
          );
        }
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new BadRequestException(
            `موجودی «${item.product.name}» برای ثبت سفارش کافی نیست`,
          );
        }

        subtotal += item.product.price * item.quantity;
        orderItems.push({
          productId: item.productId,
          name: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity,
        });
      }

      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
      const address = {
        fullName: dto.shippingAddress.fullName.trim(),
        line1: dto.shippingAddress.line1.trim(),
        line2: dto.shippingAddress.line2?.trim() || null,
        city: dto.shippingAddress.city.trim(),
        state: dto.shippingAddress.state?.trim() || null,
        postalCode: dto.shippingAddress.postalCode,
        country: dto.shippingAddress.country ?? 'IR',
        phone: dto.shippingAddress.phone?.trim() || null,
        isDefault: dto.shippingAddress.isDefault ?? false,
      };
      const orderNumber = `CR-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          email: user.email,
          status: 'PENDING',
          subtotal,
          shipping,
          total: subtotal + shipping,
          shippingAddress: address,
          note: dto.note?.trim() || null,
          items: { create: orderItems },
        },
        include: orderInclude,
      });

      if (dto.saveAddress) {
        if (address.isDefault) {
          await tx.address.updateMany({
            where: { userId },
            data: { isDefault: false },
          });
        }
        await tx.address.create({ data: { ...address, userId } });
      }

      await tx.cartItem.deleteMany({ where: { cart: { userId } } });
      return createdOrder;
    });

    const view = this.toOrderView(order);

    // Asynchronously notify customer via SMS
    const recipientPhone = dto.shippingAddress.phone || order.user?.phone;
    if (recipientPhone) {
      this.sms
        .sendOrderConfirmation(
          recipientPhone,
          order.orderNumber,
          dto.shippingAddress.fullName || order.user?.name || 'مشتری گرامی',
          order.total,
        )
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Order confirmation SMS failed: ${msg}`);
        });
    }

    return view;
  }

  async findByUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => this.toOrderView(order));
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('سفارش مورد نظر پیدا نشد');
    return this.toOrderView(order);
  }

  async cancelForUser(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true },
    });
    if (!order) throw new NotFoundException('سفارش مورد نظر پیدا نشد');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('فقط سفارش در انتظار پرداخت قابل لغو است');
    }
    return this.transitionStatus(orderId, 'CANCELLED');
  }

  async updateStatus(orderId: string, status: OrderStatusValue) {
    return this.transitionStatus(orderId, status);
  }

  /**
   * Cancels a stale unpaid order and releases its reserved stock. The status
   * and payment are re-checked inside the transaction so a payment that lands
   * between selection and cancellation can never be reversed.
   */
  async cancelExpiredPendingOrder(orderId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, status: 'PENDING' },
        include: { items: true },
      });
      if (!order) return false;

      const settled = await tx.paymentTransaction.count({
        where: { orderId, status: 'SUCCESS' },
      });
      if (settled > 0) return false;

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
      return true;
    });
  }

  /** IDs of unpaid PENDING orders older than the cutoff, oldest first. */
  async findExpiredPendingIds(cutoff: Date, take = 100): Promise<string[]> {
    const rows = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
        payments: { none: { status: 'SUCCESS' } },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take,
    });
    return rows.map((row) => row.id);
  }

  private async transitionStatus(orderId: string, status: OrderStatusValue) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: { select: { phone: true, name: true } } },
      });
      if (!order) throw new NotFoundException('سفارش مورد نظر پیدا نشد');

      const current = order.status;
      if (current === status) {
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          updatedAt: order.updatedAt,
          shippingAddress: order.shippingAddress,
          user: order.user,
        };
      }
      if (!ALLOWED_TRANSITIONS[current].includes(status)) {
        throw new BadRequestException(
          `تغییر وضعیت از ${current} به ${status} مجاز نیست`,
        );
      }

      if (status === 'CANCELLED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          updatedAt: true,
          shippingAddress: true,
          user: { select: { phone: true, name: true } },
        },
      });

      return updated;
    });

    const shippingPhone = (
      result.shippingAddress as Record<string, string> | null
    )?.phone;
    const recipientPhone = shippingPhone || result.user?.phone;
    if (recipientPhone && STATUS_LABELS[status]) {
      this.sms
        .sendOrderStatusUpdate(
          recipientPhone,
          result.orderNumber,
          STATUS_LABELS[status],
        )
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Order status update SMS failed: ${msg}`);
        });
    }

    return {
      id: result.id,
      orderNumber: result.orderNumber,
      status: result.status,
      updatedAt: result.updatedAt,
    };
  }

  private toOrderView(order: OrderRow) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      email: order.email,
      customerName: order.user?.name ?? '',
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      note: order.note,
      paymentGateway: order.paymentGateway ?? null,
      paymentRefId: order.paymentRefId ?? null,
      paidAt: order.paidAt ?? null,
      shippingAddress: order.shippingAddress ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
        image: item.product.images[0]?.url ?? null,
      })),
    };
  }
}
