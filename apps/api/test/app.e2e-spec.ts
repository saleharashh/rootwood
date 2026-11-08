import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'CraftedRoot!2026';

type ApiResponse = {
  headers: Record<string, string | string[] | undefined>;
};

function authCookie(response: ApiResponse): string {
  const raw = response.headers['set-cookie'];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const auth = cookies.find((cookie) => cookie.startsWith('craftedroot_auth='));
  if (!auth) throw new Error('Authentication cookie was not set');
  return auth.split(';')[0];
}

describe('CraftedRoot API (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminCookie: string;
  let nadiaCookie: string;
  let rezaCookie: string;
  let userCookie: string;
  let bowl: any;
  let orderId: string;
  let reviewId: string;
  let ticketId: string;

  async function loginAs(email: string) {
    const res = await request(server)
      .post('/auth/login')
      .send({ email, password: DEMO_PASSWORD })
      .expect(200);
    return authCookie(res);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    adminCookie = await loginAs('hello@craftedroot.com');
    nadiaCookie = await loginAs('nadia@example.com');
    rezaCookie = await loginAs('reza@example.com');

    const catalog = await request(server)
      .get('/catalog/products?limit=50')
      .expect(200);
    bowl = catalog.body.items.find(
      (product: { sku: string }) => product.sku === 'CR-BWL-MUL-010',
    );
    expect(bowl).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('service health', () => {
    it('reports the API and database as healthy', async () => {
      const res = await request(server).get('/health').expect(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        service: 'craftedroot-api',
        checks: { database: 'up' },
      });
    });

    it('serves a small service index', async () => {
      const res = await request(server).get('/').expect(200);
      expect(res.body).toMatchObject({ service: 'craftedroot-api' });
    });
  });

  describe('catalog', () => {
    it('returns categories, facets and seeded products', async () => {
      const [categories, facets, products] = await Promise.all([
        request(server).get('/catalog/categories').expect(200),
        request(server).get('/catalog/facets').expect(200),
        request(server).get('/catalog/products?limit=50').expect(200),
      ]);
      expect(categories.body.length).toBeGreaterThanOrEqual(4);
      expect(facets.body.woodTypes.length).toBeGreaterThan(0);
      expect(products.body.total).toBeGreaterThanOrEqual(10);
      expect(products.body.items[0]).toHaveProperty('rating');
    });

    it('filters products by search', async () => {
      const res = await request(server)
        .get('/catalog/products?search=قفسه')
        .expect(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.items[0].name).toContain('قفسه');
    });

    it('returns a product by slug and 404 for unknown slugs', async () => {
      const res = await request(server)
        .get(`/catalog/products/${bowl.slug}`)
        .expect(200);
      expect(res.body.id).toBe(bowl.id);
      expect(res.body.images[0].url).toMatch(/^\/images\//);
      await request(server)
        .get('/catalog/products/not-a-real-slug')
        .expect(404);
    });
  });

  describe('validation and access control', () => {
    it('rejects invalid registrations and unexpected fields', async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'short', name: 'x' })
        .expect(400);

      await request(server)
        .post('/auth/register')
        .send({
          email: `role-${Date.now()}@example.com`,
          password: 'CraftedRoot!2026',
          name: 'کاربر مخرب',
          role: 'ADMIN',
        })
        .expect(400);
    });

    it('requires auth for admin routes and rejects customers', async () => {
      await request(server).get('/admin/summary').expect(401);
      await request(server)
        .get('/admin/summary')
        .set('Cookie', nadiaCookie)
        .expect(403);
    });

    it('rejects guest carts without a session id', async () => {
      await request(server).get('/cart').expect(400);
      await request(server)
        .get('/cart')
        .set('x-cart-session', 'short')
        .expect(400);
    });
  });

  describe('admin dashboard API', () => {
    it('summarises revenue, orders and open work', async () => {
      const res = await request(server)
        .get('/admin/summary')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.revenue).toBeGreaterThan(0);
      expect(res.body.ordersByStatus.DELIVERED).toBeGreaterThan(0);
      expect(res.body.pendingReviews).toBeGreaterThanOrEqual(1);
      expect(res.body.newTickets).toBeGreaterThanOrEqual(1);
      expect(res.body.salesByDay).toHaveLength(7);
      expect(res.body.lowStock.length).toBeGreaterThan(0);
    });

    it('paginates, filters and searches orders', async () => {
      const bySearch = await request(server)
        .get('/admin/orders?search=CR-DEMO-1041')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(bySearch.body.items).toHaveLength(1);
      expect(bySearch.body.items[0].customerName).toBe('نادیا فرخی');

      const delivered = await request(server)
        .get('/admin/orders?status=DELIVERED&limit=2')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(delivered.body.limit).toBe(2);
      expect(
        delivered.body.items.every(
          (order: { status: string }) => order.status === 'DELIVERED',
        ),
      ).toBe(true);
    });

    it('lists reviews for moderation', async () => {
      const res = await request(server)
        .get('/admin/reviews?status=pending')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.items.every(
          (review: { approved: boolean }) => !review.approved,
        ),
      ).toBe(true);
    });
  });

  describe('cart, checkout and order ownership', () => {
    const sessionId = 'e2e-guest-session-1234567890';

    it('merges a guest cart into a new account', async () => {
      await request(server)
        .post('/cart/items')
        .set('x-cart-session', sessionId)
        .send({ productId: bowl.id, quantity: 1 })
        .expect(201);

      const guestCart = await request(server)
        .get('/cart')
        .set('x-cart-session', sessionId)
        .expect(200);
      expect(guestCart.body.summary.itemCount).toBe(1);

      const registration = await request(server)
        .post('/auth/register')
        .send({
          email: `e2e-${Date.now()}@example.com`,
          password: DEMO_PASSWORD,
          name: 'کاربر تست',
        })
        .expect(201);
      userCookie = authCookie(registration);

      await request(server)
        .post('/cart/merge')
        .set('Cookie', userCookie)
        .send({ sessionId })
        .expect(201);

      const cart = await request(server)
        .get('/cart')
        .set('Cookie', userCookie)
        .expect(200);
      expect(cart.body.summary.itemCount).toBe(1);
      expect(cart.body.items[0].product.id).toBe(bowl.id);
    });

    it('decrements stock when an order is placed', async () => {
      const startingStock = (
        await request(server).get(`/catalog/products/${bowl.slug}`)
      ).body.stock;

      const res = await request(server)
        .post('/orders')
        .set('Cookie', userCookie)
        .send({
          shippingAddress: {
            fullName: 'کاربر تست',
            line1: 'خیابان تست، پلاک ۱',
            city: 'تهران',
            postalCode: '1234567890',
            phone: '+98 912 000 0000',
          },
          saveAddress: true,
        })
        .expect(201);

      expect(res.body.status).toBe('PENDING');
      expect(res.body.subtotal).toBe(bowl.price);
      expect(res.body.shipping).toBe(250_000);
      expect(res.body.total).toBe(bowl.price + 250_000);
      orderId = res.body.id;

      const after = await request(server).get(`/catalog/products/${bowl.slug}`);
      expect(after.body.stock).toBe(startingStock - 1);
    });

    it('blocks other customers from reading the order', async () => {
      await request(server)
        .get(`/orders/${orderId}`)
        .set('Cookie', rezaCookie)
        .expect(404);
    });

    it('restores stock when a pending order is cancelled', async () => {
      const before = await request(server).get(
        `/catalog/products/${bowl.slug}`,
      );

      const res = await request(server)
        .post(`/orders/${orderId}/cancel`)
        .set('Cookie', userCookie)
        .expect(201);
      expect(res.body.status).toBe('CANCELLED');

      const after = await request(server).get(`/catalog/products/${bowl.slug}`);
      expect(after.body.stock).toBe(before.body.stock + 1);
    });
  });

  describe('reviews and order transitions', () => {
    it('lets a verified buyer review, moderates it, then publishes it', async () => {
      await request(server)
        .post('/cart/items')
        .set('Cookie', userCookie)
        .send({ productId: bowl.id, quantity: 1 })
        .expect(201);

      const order = await request(server)
        .post('/orders')
        .set('Cookie', userCookie)
        .send({
          shippingAddress: {
            fullName: 'کاربر تست',
            line1: 'خیابان تست، پلاک ۱',
            city: 'تهران',
            postalCode: '1234567890',
          },
        })
        .expect(201);
      orderId = order.body.id;

      await request(server)
        .patch(`/orders/${orderId}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'PAID' })
        .expect(200);

      const review = await request(server)
        .post(`/reviews/product/${bowl.id}`)
        .set('Cookie', userCookie)
        .send({
          rating: 5,
          title: 'نظر تستی',
          body: 'کیفیت ساخت و پرداخت سطح عالی بود.',
        })
        .expect(201);
      expect(review.body.approved).toBe(false);
      reviewId = review.body.id;

      const pending = await request(server)
        .get('/admin/reviews?status=pending')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(
        pending.body.items.some((item: { id: string }) => item.id === reviewId),
      ).toBe(true);

      await request(server)
        .patch(`/reviews/${reviewId}/approval`)
        .set('Cookie', adminCookie)
        .send({ approved: true })
        .expect(200);

      const published = await request(server)
        .get(`/reviews/product/${bowl.id}`)
        .expect(200);
      expect(
        published.body.reviews.some(
          (item: { id: string }) => item.id === reviewId,
        ),
      ).toBe(true);
      expect(published.body.rating.count).toBeGreaterThanOrEqual(1);
    });

    it('enforces the order status state machine', async () => {
      await request(server)
        .patch(`/orders/${orderId}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'DELIVERED' })
        .expect(400);

      await request(server)
        .patch(`/orders/${orderId}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'SHIPPED' })
        .expect(200);

      const delivered = await request(server)
        .patch(`/orders/${orderId}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'DELIVERED' })
        .expect(200);
      expect(delivered.body.status).toBe('DELIVERED');
    });

    it('rejects reviews from customers who did not buy the product', async () => {
      await request(server)
        .post(`/reviews/product/${bowl.id}`)
        .set('Cookie', rezaCookie)
        .send({ rating: 4, body: 'بدون خرید نمی‌شود نظر داد.' })
        .expect(403);
    });
  });

  describe('contact inbox', () => {
    it('accepts a public message and lets only admins triage it', async () => {
      const created = await request(server)
        .post('/contact')
        .send({
          name: 'مشتری تست',
          email: 'ticket@example.com',
          subject: 'سؤال تست',
          message: 'متن پیام تست برای بررسی پنل مدیریت.',
        })
        .expect(201);
      ticketId = created.body.id;

      await request(server)
        .get('/contact')
        .set('Cookie', userCookie)
        .expect(403);

      const inbox = await request(server)
        .get('/contact?status=NEW')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(
        inbox.body.items.some((item: { id: string }) => item.id === ticketId),
      ).toBe(true);

      const updated = await request(server)
        .patch(`/contact/${ticketId}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'RESOLVED' })
        .expect(200);
      expect(updated.body.status).toBe('RESOLVED');
    });
  });

  describe('session lifecycle', () => {
    it('invalidates the token on logout', async () => {
      await request(server)
        .get('/auth/me')
        .set('Cookie', rezaCookie)
        .expect(200);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', rezaCookie)
        .expect(200);

      await request(server)
        .get('/auth/me')
        .set('Cookie', rezaCookie)
        .expect(401);
    });

    it('invalidates old tokens after a password change', async () => {
      const newPassword = 'NewCraftedRoot!2026';
      const changed = await request(server)
        .post('/auth/change-password')
        .set('Cookie', userCookie)
        .send({ currentPassword: DEMO_PASSWORD, newPassword })
        .expect(200);
      const newCookie = authCookie(changed);

      await request(server)
        .get('/auth/me')
        .set('Cookie', userCookie)
        .expect(401);
      const me = await request(server)
        .get('/auth/me')
        .set('Cookie', newCookie)
        .expect(200);
      expect(me.body.email).toContain('e2e-');
    });
  });
});
