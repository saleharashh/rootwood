import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FREE_SHIPPING_THRESHOLD = 5_000_000;
const SHIPPING_FLAT = 250_000;

interface CartOwner {
  userId?: string;
  sessionId?: string;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private ownerWhere(owner: CartOwner) {
    const { userId, sessionId } = owner;
    if (!userId && !sessionId) {
      throw new BadRequestException(
        'برای استفاده از سبد خرید باید وارد شوید یا شناسه نشست ارسال شود',
      );
    }
    if (sessionId && !/^[A-Za-z0-9_-]{16,80}$/.test(sessionId)) {
      throw new BadRequestException('شناسه نشست سبد خرید نامعتبر است');
    }
    return userId ? { userId } : { sessionId: sessionId! };
  }

  private async resolveCart(owner: CartOwner) {
    const where = this.ownerWhere(owner);
    const existing = await this.prisma.cart.findFirst({ where });
    if (existing) return existing;
    return this.prisma.cart.create({ data: where });
  }

  private async findCart(owner: CartOwner) {
    return this.prisma.cart.findFirst({ where: this.ownerWhere(owner) });
  }

  async getCart(owner: CartOwner) {
    const cart = await this.prisma.cart.findFirst({
      where: this.ownerWhere(owner),
      include: {
        items: {
          orderBy: { id: 'asc' },
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    });

    if (!cart) return this.emptyCart();
    return this.toCartView(cart);
  }

  async addItem(owner: CartOwner, productId: string, quantity = 1) {
    const cart = await this.resolveCart(owner);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true, isActive: true, name: true },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('محصول مورد نظر پیدا نشد');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > product.stock) {
      throw new BadRequestException(
        `تنها ${product.stock} عدد از «${product.name}» در انبار موجود است`,
      );
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: nextQty },
    });
    return this.getCart(owner);
  }

  async updateItem(owner: CartOwner, itemId: string, quantity: number) {
    const cart = await this.findCart(owner);
    if (!cart) throw new NotFoundException('سبد خرید پیدا نشد');

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: { select: { stock: true, name: true } } },
    });
    if (!item) throw new NotFoundException('قلم سبد خرید پیدا نشد');
    if (quantity > item.product.stock) {
      throw new BadRequestException(
        `تنها ${item.product.stock} عدد از «${item.product.name}» در انبار موجود است`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return this.getCart(owner);
  }

  async removeItem(owner: CartOwner, itemId: string) {
    const cart = await this.findCart(owner);
    if (!cart) throw new NotFoundException('سبد خرید پیدا نشد');

    const deleted = await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('قلم سبد خرید پیدا نشد');
    }
    return this.getCart(owner);
  }

  async clear(owner: CartOwner) {
    const cart = await this.findCart(owner);
    if (!cart) return this.emptyCart();
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(owner);
  }

  async mergeGuestCart(userId: string, sessionId: string) {
    const guest = await this.prisma.cart.findFirst({
      where: this.ownerWhere({ sessionId }),
      include: { items: { include: { product: true } } },
    });
    if (!guest || guest.items.length === 0) {
      if (guest) await this.prisma.cart.delete({ where: { id: guest.id } });
      return this.getCart({ userId });
    }

    const userCart = await this.resolveCart({ userId });
    for (const item of guest.items) {
      if (!item.product.isActive || item.product.stock < 1) continue;
      const existing = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: { cartId: userCart.id, productId: item.productId },
        },
      });
      const merged = Math.min(
        (existing?.quantity ?? 0) + item.quantity,
        item.product.stock,
        99,
      );
      await this.prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: userCart.id, productId: item.productId },
        },
        create: {
          cartId: userCart.id,
          productId: item.productId,
          quantity: merged,
        },
        update: { quantity: merged },
      });
    }

    await this.prisma.cart.delete({ where: { id: guest.id } });
    return this.getCart({ userId });
  }

  private emptyCart() {
    return {
      id: null,
      items: [],
      summary: {
        itemCount: 0,
        subtotal: 0,
        shipping: 0,
        total: 0,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      },
    };
  }

  private toCartView(cart: {
    id: string;
    items: Array<{
      id: string;
      quantity: number;
      product: {
        id: string;
        slug: string;
        name: string;
        price: number;
        stock: number;
        images: Array<{ url: string }>;
      };
    }>;
  }) {
    const items = cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      lineTotal: item.product.price * item.quantity,
      product: {
        id: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        price: item.product.price,
        stock: item.product.stock,
        image: item.product.images[0]?.url ?? null,
      },
    }));
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

    return {
      id: cart.id,
      items,
      summary: {
        itemCount,
        subtotal,
        shipping,
        total: subtotal + shipping,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      },
    };
  }
}
