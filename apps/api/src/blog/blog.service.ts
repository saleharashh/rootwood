import { Injectable, NotFoundException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, limit = 9, tag?: string, q?: string) {
    const where: Record<string, unknown> = { published: true };
    if (tag) where.tags = { has: tag };
    if (q?.trim()) {
      where.OR = [
        { title: { contains: q.trim(), mode: 'insensitive' } },
        { excerpt: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverUrl: true,
          tags: true,
          published: true,
          authorId: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: rows,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async getBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug, published: true },
      include: {
        author: { select: { name: true, avatarUrl: true } },
      },
    });

    if (!post) throw new NotFoundException('نوشته مورد نظر پیدا نشد');

    const related = await this.prisma.post.findMany({
      where: {
        published: true,
        id: { not: post.id },
        tags: { hasSome: post.tags },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverUrl: true,
        tags: true,
        published: true,
        authorId: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 4,
      orderBy: { publishedAt: 'desc' },
    });

    return {
      post: {
        ...post,
        content: sanitizeHtml(post.content, {
          allowedTags: [
            'h2',
            'h3',
            'p',
            'br',
            'strong',
            'em',
            'ul',
            'ol',
            'li',
            'blockquote',
            'code',
            'pre',
            'a',
          ],
          allowedAttributes: { a: ['href', 'title'] },
          allowedSchemes: ['http', 'https', 'mailto'],
        }),
      },
      related,
    };
  }

  async getTags() {
    const tags = await this.prisma.post.findMany({
      where: { published: true },
      select: { tags: true },
    });

    const set = new Set<string>();
    for (const post of tags) {
      for (const tag of post.tags) set.add(tag);
    }

    return Array.from(set).sort();
  }
}
