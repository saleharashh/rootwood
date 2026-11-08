import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  ProductQueryDto,
  PRODUCT_SORTS,
  UpdateCategoryDto,
  UpdateProductDto,
} from './dto/catalog.dto';

const ratingAggregate: Prisma.ProductInclude = {
  reviews: {
    where: { approved: true },
    select: { rating: true },
  },
};

type ProductWithReviews = Prisma.ProductGetPayload<{
  include: typeof ratingAggregate;
}>;

export interface RatingSummary {
  average: number;
  count: number;
}

export function toProductView<
  T extends ProductWithReviews & { category?: unknown; images?: unknown },
>(product: T) {
  const ratings = product.reviews ?? [];
  const count = ratings.length;
  const average = count
    ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / count) * 10) /
      10
    : 0;

  const rest = { ...product };
  Reflect.deleteProperty(rest, 'reviews');
  return {
    ...rest,
    rating: { average, count } satisfies RatingSummary,
  };
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    return categories.map(({ _count, ...category }) => ({
      ...category,
      productCount: _count.products,
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async deleteCategory(id: string) {
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw new BadRequestException('ابتدا محصولات این دسته را منتقل کنید');
    }
    try {
      await this.prisma.category.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async listProducts(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { tagline: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { woodType: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.category) where.category = { slug: query.category };
    if (query.woodType) where.woodType = query.woodType;
    if (query.featured !== undefined) where.featured = query.featured;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      };
    }

    const limit = query.limit ?? 24;
    const offset = query.offset ?? 0;
    const include = {
      ...ratingAggregate,
      category: true,
      images: { orderBy: { sortOrder: 'asc' as const } },
    };

    if (query.sort === 'rating') {
      const rows = await this.prisma.product.findMany({ where, include });
      const sorted = rows
        .map(toProductView)
        .sort(
          (a, b) =>
            b.rating.average - a.rating.average ||
            b.rating.count - a.rating.count ||
            b.createdAt.getTime() - a.createdAt.getTime(),
        );
      return {
        items: sorted.slice(offset, offset + limit),
        total: sorted.length,
        limit,
        offset,
        hasMore: offset + limit < sorted.length,
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include,
        orderBy: this.buildOrderBy(query.sort ?? 'newest'),
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: rows.map(toProductView),
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total,
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        ...ratingAggregate,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(`محصول «${slug}» پیدا نشد`);
    }
    return toProductView(product);
  }

  async getCatalogFacets() {
    const [woodTypes, priceRange] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true, woodType: { not: null } },
        select: { woodType: true },
        distinct: ['woodType'],
        orderBy: { woodType: 'asc' },
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return {
      woodTypes: woodTypes
        .map((item) => item.woodType)
        .filter((item): item is string => Boolean(item)),
      priceMin: priceRange._min.price ?? 0,
      priceMax: priceRange._max.price ?? 0,
    };
  }

  async getRelatedProducts(slug: string, limit = 4) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true, categoryId: true },
    });
    if (!product) throw new NotFoundException(`محصول «${slug}» پیدا نشد`);

    const rows = await this.prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      include: {
        ...ratingAggregate,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return rows.map(toProductView);
  }

  async createProduct(dto: CreateProductDto) {
    const { images, ...data } = dto;
    try {
      return await this.prisma.product.create({
        data: {
          ...data,
          images: images?.length
            ? {
                create: images.map((url, index) => ({
                  url,
                  sortOrder: index,
                  alt: dto.name,
                })),
              }
            : undefined,
        },
        include: { images: true, category: true },
      });
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const { images, ...data } = dto;
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!existing) throw new NotFoundException('محصول مورد نظر پیدا نشد');

    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          ...data,
          ...(images && {
            images: {
              deleteMany: {},
              create: images.map((url, index) => ({
                url,
                sortOrder: index,
                alt: data.name ?? existing.name,
              })),
            },
          }),
        },
        include: { images: true, category: true },
      });
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async deleteProduct(id: string) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, isActive: true },
      });
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  private buildOrderBy(
    sort: ProductQueryDto['sort'],
  ): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'price-asc':
        return [{ price: 'asc' }, { id: 'asc' }];
      case 'price-desc':
        return [{ price: 'desc' }, { id: 'asc' }];
      case 'name':
        return [{ name: 'asc' }, { id: 'asc' }];
      case 'newest':
      default:
        return [{ createdAt: 'desc' }, { id: 'asc' }];
    }
  }

  private rethrowWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('slug یا SKU تکراری است');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('دسته‌بندی انتخاب‌شده معتبر نیست');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('رکورد مورد نظر پیدا نشد');
      }
    }
    throw error;
  }

  static get supportedSorts() {
    return PRODUCT_SORTS;
  }
}
