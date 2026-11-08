import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const isProduction = process.env.NODE_ENV === 'production';
const DEMO_PASSWORD =
  process.env.SEED_DEMO_PASSWORD ?? (isProduction ? undefined : 'CraftedRoot!2026');
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

async function main() {
  if (isProduction && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    throw new Error(
      'Destructive demo seeding is disabled in production. Set SEED_ALLOW_PRODUCTION=true to override.',
    );
  }
  if (!DEMO_PASSWORD || DEMO_PASSWORD.length < 8) {
    throw new Error('SEED_DEMO_PASSWORD must be set to at least 8 characters.');
  }

  console.log('[seed] پاک‌کردن داده‌های قبلی...');
  await prisma.contactMessage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.post.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('[seed] ساخت کاربران نمونه...');
  await prisma.user.create({
    data: {
      id: 'admin-user',
      email: 'hello@craftedroot.com',
      name: 'سامی رحیمی',
      phone: '+98 912 000 0000',
      role: 'ADMIN',
      passwordHash,
    },
  });
  const [nadia, reza, mina] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'nadia@example.com',
        name: 'نادیا فرخی',
        role: 'CUSTOMER',
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'reza@example.com',
        name: 'رضا احمدی',
        role: 'CUSTOMER',
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'mina@example.com',
        name: 'مینا تهرانی',
        role: 'CUSTOMER',
        passwordHash,
      },
    }),
  ]);

  console.log('[seed] ساخت دسته‌بندی‌ها...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        slug: 'tables',
        name: 'میزها',
        description:
          'میز غذاخوری، میز کنار و میز کوچک، ساخته‌شده از چوب سخت یکپارچه.',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'seating',
        name: 'نشیمن',
        description: 'صندلی، نیمکت و چهارپایه، شکل‌گرفته برای راحتی هر روز.',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'storage',
        name: 'ذخیره‌سازی',
        description: 'قفسه، دراور و صندوق‌هایی که فضا را نفس‌کش می‌کنند.',
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'decor',
        name: 'دکور',
        description: 'کاسه، سینی، چراغ و اشیای کوچک با حس دست‌ساز.',
        sortOrder: 4,
      },
    }),
  ]);

  console.log('[seed] ساخت محصولات...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        slug: 'persian-oak-dining-table',
        name: 'میز غذاخوری بلوط ایرانی',
        tagline: 'میز هشت‌نفره از بلوط ایرانیِ دست‌پرداخت.',
        description:
          'میز غذاخوری از بلوط ایرانیِ رگه‌چهارم، با صفحه ضخیم و پرداخت مات روغنی که به‌راحتی تمیز می‌شود. پایه با اتصال کام و زبانه ساخته شده و لبه‌ها با دست نرم شده‌اند تا در یک خانه پرمشغله حس گرمی بدهد. تفاوت رنگ میان تخته‌ها بخشی از شخصیت قطعه است، نه عیب آن.',
        price: 18_500_000,
        compareAt: 22_000_000,
        sku: 'CR-TBL-OAK-001',
        stock: 4,
        categoryId: categories[0].id,
        woodType: 'بلوط ایرانی',
        finish: 'روغن موم مات',
        dimensions: '۲۱۰ × ۹۵ × ۷۵ سانتی‌متر',
        weightKg: 52,
        featured: true,
        images: {
          create: [
            {
              url: '/images/oak-dining-table.webp',
              alt: 'میز غذاخوری بلوط ایرانی، نمای از بالا',
              sortOrder: 0,
            },
            {
              url: '/images/oak-dining-table-detail.webp',
              alt: 'میز غذاخوری بلوط ایرانی، جزئیات گوشه',
              sortOrder: 1,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'walnut-coffee-table',
        name: 'میز کنار گردو',
        tagline: 'کوتاه، آرام و آمادهٔ نشستن کنار مبل.',
        description:
          'میز کنارِ کوتاه از گردوی سیاه آمریکایی با پرداخت دست‌مال‌کشی که با گذر زمان عمیق‌تر می‌شود. صفحه روی دامنه‌ای باریک و پایه‌های مخروطی نشسته و بدون شکننده به نظر رسیدن، جای کمی می‌گیرد. ایده‌آل کنار مبل در نشیمن، اتاق مطالعه یا گوشه‌ای دنج.',
        price: 6_800_000,
        sku: 'CR-TBL-WAL-002',
        stock: 7,
        categoryId: categories[0].id,
        woodType: 'گردوی سیاه آمریکایی',
        finish: 'روغن و موم',
        dimensions: '۱۲۰ × ۶۰ × ۴۲ سانتی‌متر',
        weightKg: 18,
        images: {
          create: [
            {
              url: '/images/walnut-coffee-table.webp',
              alt: 'میز کنار گردو',
              sortOrder: 0,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'cherry-writing-desk',
        name: 'میز تحریر گیلاس',
        tagline: 'میزکاری که کارهای طولانی را دلپذیر می‌کند.',
        description:
          'میز تحریر جمع‌وجور از گیلاس آمریکایی برگزیده، با پانل پشت، لبهٔ جلویی نرم‌شده و یک کشو با آستر گردو. سطح آن برای استفادهٔ روزانه به‌قدر کافی سخت پرداخت شده و گرمای گیلاس را نگه می‌دارد. با گذر زمان به سرخیِ غنی می‌گراید.',
        price: 9_200_000,
        sku: 'CR-DESK-CHR-003',
        stock: 3,
        categoryId: categories[0].id,
        woodType: 'گیلاس آمریکایی',
        finish: 'پلی‌اورتان ساتن',
        dimensions: '۱۳۰ × ۶۰ × ۷۵ سانتی‌متر',
        weightKg: 26,
        images: {
          create: [
            {
              url: '/images/cherry-writing-desk.webp',
              alt: 'میز تحریر گیلاس، نمای مورب',
              sortOrder: 0,
            },
            {
              url: '/images/cherry-writing-desk-detail.webp',
              alt: 'میز تحریر گیلاس، جزئیات کشو',
              sortOrder: 1,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'oak-dining-chair',
        name: 'صندلی غذاخوری بلوط',
        tagline: 'راحت سر میز، ساده کنار دیوار.',
        description:
          'صندلی غذاخوری از بلوط ایرانی یکپارچه، با نشیمن و پشتی فرم‌گرفته برای راحتی ملایم. اتصالات پنهان‌اند، خط‌ها آرام و پرداخت سطح بهداشتی و راحت تمیز می‌شود. تک‌فروشی می‌شود.',
        price: 2_450_000,
        sku: 'CR-CHR-OAK-004',
        stock: 24,
        categoryId: categories[1].id,
        woodType: 'بلوط ایرانی',
        finish: 'روغن موم مات',
        dimensions: '۴۸ × ۵۲ × ۸۲ سانتی‌متر',
        weightKg: 5.4,
        featured: true,
        images: {
          create: [
            {
              url: '/images/oak-dining-chair.webp',
              alt: 'صندلی غذاخوری بلوط، نمای از پهلو',
              sortOrder: 0,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'walnut-milk-bench',
        name: 'نیمکت گردو',
        tagline: 'نیمکتی که پای میز یا کنار تخت جا می‌شود.',
        description:
          'نیمکت باریک و محکم از گردوی سیاه با صفحهٔ یکپارچه و دو پایهٔ پشتی. طوری ساخته شده که بی‌صدا زیر میز غذاخوری یا در راهرو بنشیند و همان‌قدر کنار تخت یا ورودی به کار بیاید. لبه‌های صفحه نرم شده و پرداخت با دست انجام گرفته است.',
        price: 3_150_000,
        sku: 'CR-BENCH-WAL-005',
        stock: 6,
        categoryId: categories[1].id,
        woodType: 'گردوی سیاه آمریکایی',
        finish: 'روغن و موم',
        dimensions: '۱۰۰ × ۳۸ × ۴۶ سانتی‌متر',
        weightKg: 9.2,
        images: {
          create: [
            {
              url: '/images/walnut-bench.webp',
              alt: 'نیمکت گردو، نمای از بالا',
              sortOrder: 0,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'persian-oak-dining-chair',
        name: 'صندلی غذاخوری بلوط ایرانی',
        tagline: 'هم‌خانوادهٔ میز، با پرداخت دستی.',
        description:
          'صندلی غذاخوری از همان بلوط ایرانی مجموعهٔ میز، با پشتی منحنی که با بدن همراه می‌شود. همراه طبیعی میز غذاخوری بلوط ایرانی است، اما به‌تنهایی هم خوش‌نشین است. تک‌فروشی می‌شود.',
        price: 2_300_000,
        sku: 'CR-CHR-OAK-006',
        stock: 18,
        categoryId: categories[1].id,
        woodType: 'بلوط ایرانی',
        finish: 'روغن موم مات',
        dimensions: '۴۸ × ۵۲ × ۸۲ سانتی‌متر',
        weightKg: 5.2,
        images: {
          create: [
            {
              url: '/images/oak-dining-chair.webp',
              alt: 'صندلی غذاخوری بلوط ایرانی',
              sortOrder: 0,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'mulberry-bookshelf',
        name: 'قفسه کتاب توت',
        tagline: 'قفسه‌های باز با ریتمی گرم و عمودی.',
        description:
          'قفسهٔ کتاب پنج‌طبقه از توت ایرانی، یکی از بهترین چوب‌های سخت این منطقه، شناخته‌شده با تن‌های بنفش‌قهوه‌ای و دانهٔ ریز و فشرده. بدنه با اتصالات کامِ چسب‌خورده و پانلی پشتی که بدنه را گونیا نگه می‌دارد ساخته می‌شود. مناسب کتاب، سفال و نمایش ترکیبی.',
        price: 7_400_000,
        sku: 'CR-SLV-MUL-007',
        stock: 4,
        categoryId: categories[2].id,
        woodType: 'توت ایرانی',
        finish: 'روغن موم مات',
        dimensions: '۸۰ × ۳۵ × ۱۸۰ سانتی‌متر',
        weightKg: 34,
        featured: true,
        images: {
          create: [
            {
              url: '/images/mulberry-bookshelf.webp',
              alt: 'قفسه کتاب توت، نمای تمام‌قد',
              sortOrder: 0,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'oak-dresser',
        name: 'دراور بلوط',
        tagline: 'ذخیره‌سازی که در نگاه اول جلوی چشم نیست.',
        description:
          'دراور شش‌کشو از بلوط ایرانی، با درب پانل تخت در بخش بالا و دو کشوی کم‌عمق در پایین برای اشیای کوچک. کشوها روی ریل‌های کناری با وزنهٔ برنجی نرم حرکت می‌کنند. بدنه یکپارچه است و هیچ نئوپان یا MDF‌ی در آن به کار نرفته.',
        price: 11_800_000,
        sku: 'CR-DRW-OAK-008',
        stock: 2,
        categoryId: categories[2].id,
        woodType: 'بلوط ایرانی',
        finish: 'پلی‌اورتان ساتن',
        dimensions: '۱۴۰ × ۴۸ × ۸۵ سانتی‌متر',
        weightKg: 48,
        images: {
          create: [
            {
              url: '/images/oak-dresser.webp',
              alt: 'دراور بلوط، نمای از روبه‌رو',
              sortOrder: 0,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'walnut-serve-tray',
        name: 'سینی گردو',
        tagline: 'دسته‌دار، پرداخت‌شده، آمادهٔ میز.',
        description:
          'سینی پذیرایی دستی که از یک تختهٔ گردوی سیاه بریده شده، با دسته‌های گردو، گوشه‌های گرد و پرداخت روغنی دست‌مال‌کشی. به‌قدری سبک که راحت حمل شود و به‌قدری محکم که شام دو نفر را نگه دارد.',
        price: 980_000,
        sku: 'CR-TRAY-WAL-009',
        stock: 30,
        categoryId: categories[3].id,
        woodType: 'گردوی سیاه آمریکایی',
        finish: 'روغن و موم',
        dimensions: '۴۲ × ۲۸ × ۳ سانتی‌متر',
        weightKg: 1.3,
        images: {
          create: [
            {
              url: '/images/walnut-serving-tray.webp',
              alt: 'سینی گردو، نمای مورب',
              sortOrder: 0,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        slug: 'mulberry-bowl',
        name: 'کاسه توت',
        tagline: 'چرخ‌خورده از توت ایرانی و پرداخت با دست.',
        description:
          'کاسهٔ چرخ‌خورده از توت ایرانی، مناسب میوه یا نگه‌داشتن وسایل روی میزکار. داخل کاسه کمی زنده رها شده تا رد ابزار، دست سازنده را نشان دهد و بیرون ساییده و روغن‌خورده شده است. هر کاسه در رنگ و رگه متفاوت است.',
        price: 620_000,
        sku: 'CR-BWL-MUL-010',
        stock: 14,
        categoryId: categories[3].id,
        woodType: 'توت ایرانی',
        finish: 'روغن و موم',
        dimensions: 'قطر ۲۲ × ۹ سانتی‌متر',
        weightKg: 0.6,
        images: {
          create: [
            {
              url: '/images/mulberry-bowl.webp',
              alt: 'کاسه توت، نمای از بالا',
              sortOrder: 0,
            },
          ],
        },
      },
    }),
  ]);

  console.log('[seed] ساخت نظرها...');
  await prisma.review.createMany({
    data: [
      {
        productId: products[0].id,
        userId: 'admin-user',
        rating: 5,
        title: 'سنگین، صادق و زیبا از لحظهٔ تحویل',
        body:
          'میز با بسته‌بندی خوب و بی‌خش و خدشه رسید. پرداخت مات و قابل لمس است، رگه‌ها همان چیزی است که از بلوط ایرانی انتظار دارید و اتصالات محکم به نظر می‌رسد. تنها نکته این بود که صفحه از عکس‌ها پهن‌تر است — به شکل خوبی.',
        approved: true,
        createdAt: daysAgo(15),
      },
      {
        productId: products[0].id,
        userId: nadia.id,
        rating: 4,
        title: 'میز زیبا، ارزش انتظار را داشت',
        body:
          'دو ست هم‌خوان برای یک رستوران کوچک سفارش دادیم و هر دو با دقت مونتاژشده رسیدند. پرداخت سطح متین است و چوب گران به نظر می‌رسد. ارسال کمی طولانی‌تر از انتظار ما شد، اما بسته سالم رسید.',
        approved: true,
        createdAt: daysAgo(29),
      },
      {
        productId: products[3].id,
        userId: reza.id,
        rating: 5,
        title: 'راحت و خوش‌ساخت',
        body:
          'این صندلی را برای سه اتاق خریدم. برای شام‌های طولانی راحت است، مرتب روی هم می‌ماند و پرداخت با استفادهٔ روزمره دوام می‌آورد. رگهٔ چوب در پشتی مخصوصاً زیباست.',
        approved: true,
        createdAt: daysAgo(5),
      },
      {
        productId: products[4].id,
        userId: mina.id,
        rating: 5,
        title: 'نیمکتی جدی با چهره‌ای مهربان',
        body:
          'نیمکت از آنچه به نظر می‌رسد سنگین‌تر و کاملاً محکم است. گردو فوق‌العاده است و پرداخت نرم و یکدست. زیر میز سُر می‌خورد بدون اینکه مانع پایه شود — که هدف اصلی من همین بود.',
        approved: true,
        createdAt: daysAgo(3),
      },
      {
        productId: products[6].id,
        userId: mina.id,
        rating: 5,
        title: 'قفسه‌ها همان‌قدر عمیق‌اند که عکس‌ها نشان می‌دهند',
        body:
          'نگران بودم توت در آپارتمان ما بیش از حد تیره شود، اما در نور روز گرم است نه تیره. رگه در هر طبقه زیباست و بدنه کاملاً گونیا. ارزشش را داشت.',
        approved: false,
        createdAt: daysAgo(1),
      },
    ],
  });

  console.log('[seed] ساخت آدرس‌ها...');
  await prisma.address.createMany({
    data: [
      {
        id: 'addr-nadia',
        userId: nadia.id,
        fullName: 'نادیا فرخی',
        line1: 'خیابان ولیعصر، کوچه بهار، پلاک ۱۴',
        line2: 'طبقه سوم',
        city: 'تهران',
        state: 'تهران',
        postalCode: '1968714151',
        phone: '+98 912 111 1111',
        isDefault: true,
      },
      {
        id: 'addr-reza',
        userId: reza.id,
        fullName: 'رضا احمدی',
        line1: 'بلوار آبشار، کوچه سرو، پلاک ۸',
        city: 'اصفهان',
        state: 'اصفهان',
        postalCode: '8154712345',
        phone: '+98 913 222 2222',
        isDefault: true,
      },
      {
        id: 'addr-mina',
        userId: mina.id,
        fullName: 'مینا تهرانی',
        line1: 'خیابان هنر، مجتمع باغ، واحد ۲۲',
        city: 'شیراز',
        state: 'فارس',
        postalCode: '7146712345',
        phone: '+98 901 333 3333',
        isDefault: true,
      },
    ],
  });

  console.log('[seed] ساخت سفارش‌های نمونه...');
  await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'CR-DEMO-1041',
        userId: nadia.id,
        email: nadia.email,
        status: 'DELIVERED',
        subtotal: 23_400_000,
        shipping: 0,
        total: 23_400_000,
        shippingAddress: {
          fullName: 'نادیا فرخی',
          line1: 'خیابان ولیعصر، کوچه بهار، پلاک ۱۴',
          line2: 'طبقه سوم',
          city: 'تهران',
          state: 'تهران',
          postalCode: '1968714151',
          country: 'IR',
          phone: '+98 912 111 1111',
        },
        createdAt: daysAgo(6),
        items: {
          create: [
            {
              productId: products[0].id,
              name: products[0].name,
              unitPrice: products[0].price,
              quantity: 1,
            },
            {
              productId: products[3].id,
              name: products[3].name,
              unitPrice: products[3].price,
              quantity: 2,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'CR-DEMO-1042',
        userId: nadia.id,
        email: nadia.email,
        status: 'CANCELLED',
        subtotal: 9_200_000,
        shipping: 0,
        total: 9_200_000,
        shippingAddress: {
          fullName: 'نادیا فرخی',
          line1: 'خیابان ولیعصر، کوچه بهار، پلاک ۱۴',
          city: 'تهران',
          postalCode: '1968714151',
          country: 'IR',
        },
        note: 'قبل از ارسال منصرف شدم.',
        createdAt: daysAgo(5),
        items: {
          create: [
            {
              productId: products[2].id,
              name: products[2].name,
              unitPrice: products[2].price,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'CR-DEMO-1043',
        userId: reza.id,
        email: reza.email,
        status: 'SHIPPED',
        subtotal: 3_430_000,
        shipping: 250_000,
        total: 3_680_000,
        shippingAddress: {
          fullName: 'رضا احمدی',
          line1: 'بلوار آبشار، کوچه سرو، پلاک ۸',
          city: 'اصفهان',
          state: 'اصفهان',
          postalCode: '8154712345',
          country: 'IR',
          phone: '+98 913 222 2222',
        },
        createdAt: daysAgo(4),
        items: {
          create: [
            {
              productId: products[3].id,
              name: products[3].name,
              unitPrice: products[3].price,
              quantity: 1,
            },
            {
              productId: products[8].id,
              name: products[8].name,
              unitPrice: products[8].price,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'CR-DEMO-1044',
        userId: mina.id,
        email: mina.email,
        status: 'PAID',
        subtotal: 10_550_000,
        shipping: 0,
        total: 10_550_000,
        shippingAddress: {
          fullName: 'مینا تهرانی',
          line1: 'خیابان هنر، مجتمع باغ، واحد ۲۲',
          city: 'شیراز',
          state: 'فارس',
          postalCode: '7146712345',
          country: 'IR',
          phone: '+98 901 333 3333',
        },
        note: 'لطفاً قبل از ارسال تماس بگیرید.',
        createdAt: daysAgo(3),
        items: {
          create: [
            {
              productId: products[4].id,
              name: products[4].name,
              unitPrice: products[4].price,
              quantity: 1,
            },
            {
              productId: products[6].id,
              name: products[6].name,
              unitPrice: products[6].price,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'CR-DEMO-1045',
        userId: 'admin-user',
        email: 'hello@craftedroot.com',
        status: 'DELIVERED',
        subtotal: 31_280_000,
        shipping: 0,
        total: 31_280_000,
        shippingAddress: {
          fullName: 'سامی رحیمی',
          line1: 'خیابان کارگاه، پلاک ۳',
          city: 'تهران',
          state: 'تهران',
          postalCode: '1136912345',
          country: 'IR',
        },
        createdAt: daysAgo(2),
        items: {
          create: [
            {
              productId: products[0].id,
              name: products[0].name,
              unitPrice: products[0].price,
              quantity: 1,
            },
            {
              productId: products[7].id,
              name: products[7].name,
              unitPrice: products[7].price,
              quantity: 1,
            },
            {
              productId: products[8].id,
              name: products[8].name,
              unitPrice: products[8].price,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'CR-DEMO-1046',
        email: 'sara@example.com',
        status: 'PENDING',
        subtotal: 2_220_000,
        shipping: 250_000,
        total: 2_470_000,
        shippingAddress: {
          fullName: 'سارا کریمی',
          line1: 'میدان ونک، خیابان گاندی، پلاک ۲۱',
          city: 'تهران',
          state: 'تهران',
          postalCode: '1517712345',
          country: 'IR',
          phone: '+98 935 444 4444',
        },
        note: 'هدیه است؛ لطفاً فاکتور داخل بسته نباشد.',
        createdAt: daysAgo(1),
        items: {
          create: [
            {
              productId: products[9].id,
              name: products[9].name,
              unitPrice: products[9].price,
              quantity: 2,
            },
            {
              productId: products[8].id,
              name: products[8].name,
              unitPrice: products[8].price,
              quantity: 1,
            },
          ],
        },
      },
    }),
  ]);

  console.log('[seed] ساخت سبدهای خرید نمونه...');
  await prisma.cart.create({
    data: {
      userId: reza.id,
      items: {
        create: [
          { productId: products[3].id, quantity: 1 },
          { productId: products[8].id, quantity: 2 },
        ],
      },
    },
  });
  await prisma.cart.create({
    data: {
      sessionId: 'demo-guest-cart-session',
      items: {
        create: [{ productId: products[6].id, quantity: 1 }],
      },
    },
  });

  console.log('[seed] ساخت پیام‌های تماس...');
  await prisma.contactMessage.createMany({
    data: [
      {
        name: 'آرش محمدی',
        email: 'arash@cafe-narenj.com',
        phone: '+98 912 555 5555',
        subject: 'سفارش عمده برای کافه',
        message:
          'سلام، برای کافه‌ای با ۲۴ صندلی به ۱۲ صندلی بلوط و ۶ میز کوچک نیاز داریم. امکان تولید در بازهٔ دو ماه وجود دارد؟',
        status: 'NEW',
        createdAt: daysAgo(0.4),
      },
      {
        name: 'مینا تهرانی',
        email: 'mina@example.com',
        phone: '+98 901 333 3333',
        subject: 'زمان ساخت میز سفارشی',
        message:
          'میز غذاخوری ۱۸۰ سانتی از بلوط می‌خواهم که با قفسه‌ای که خریدم هم‌خوان باشد. زمان ساخت و هزینهٔ تقریبی چقدر است؟',
        status: 'NEW',
        userId: mina.id,
        createdAt: daysAgo(1.5),
      },
      {
        name: 'رضا احمدی',
        email: 'reza@example.com',
        phone: '+98 913 222 2222',
        subject: 'هماهنگی زمان تحویل',
        message:
          'سفارش CR-DEMO-1043 را برای روز پنجشنبه بعدازظهر هماهنگ کنید. اگر 가능 است قبل از ارسال تماس بگیرید.',
        status: 'IN_PROGRESS',
        userId: reza.id,
        createdAt: daysAgo(3.2),
      },
      {
        name: 'نادیا فرخی',
        email: 'nadia@example.com',
        subject: 'نگهداری سطح میز بلوط',
        message:
          'برای ترمیم خط‌های ریز روی میز، چه روغنی پیشنهاد می‌کنید؟ ترجیح می‌دهم خودم انجام دهم.',
        status: 'RESOLVED',
        userId: nadia.id,
        createdAt: daysAgo(21),
      },
      {
        name: 'حسین رستگار',
        email: 'hossein.r@example.com',
        subject: 'ارسال به شهرستان',
        message:
          'به بندرعباس ارسال دارید؟ هزینه و مدت ارسال برای یک صندلی چقدر می‌شود؟',
        status: 'NEW',
        createdAt: daysAgo(2.4),
      },
    ],
  });

  console.log('[seed] ساخت نوشته‌های مجله...');
  await Promise.all([
    prisma.post.create({
      data: {
        slug: 'choosing-the-right-wood-for-your-home',
        title: 'انتخاب چوب مناسب خانهٔ شما',
        excerpt:
          'راهنمای کوتاه و کاربردی دربارهٔ چهار چوب سختی که بیشتر استفاده می‌کنیم — بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی — و خانه‌ها و عادت‌هایی که هرکدام برای آن مناسب‌ترند.',
        content: `
<p>انتخاب چوب بیشتر از هر چیز جور‌کردن است تا یک قاعده: چوب درست برای اتاق، برای استفاده، و برای دست‌هایی که با آن زندگی می‌کنند. نگاه ما به چهار چوب سختی که بیشتر استفاده می‌کنیم این است.</p>

<h2>بلوط ایرانی</h2>
<p>بلوط ایرانی اسب بارکش ما برای میز و صندلی است. متراکم، راست‌دانه و بادوام، بدون آنکه در دست سنگین حس شود. رنگ آن بین قهوه‌ای گرم و کهربایی ملایم می‌نشیند و پرداخت مات را خوب می‌پذیرد: نه براق، نه ماتِ بی‌روح، بلکه قابل لمس. مناسب نشیمن خانوادگی، اتاق غذاخوری و هر چیزی که هر روز استفاده و مرتب تمیز شود.</p>

<h2>گردوی سیاه آمریکایی</h2>
<p>گردو همان تجمل آرام این گروه است: تیره، غنی و کمی رسمی‌تر از بلوط، اما هرگز خشک و سرد. با گذر زمان و با روغن عمیق‌تر می‌شود؛ به همین دلیل برای قطعه‌هایی خوب است که می‌خواهید هر روز زیباتر شوند — میز کنار، نیمکت و اشیای کوچکی که مرتب در دست می‌گیرید.</p>

<h2>گیلاس آمریکایی</h2>
<p>گیلاس دانه‌ای ریزتر و فشرده‌تر دارد و رنگی که از صورتی‌ـ‌کرم کم‌رنگ به سرخ می‌گراید، مخصوصاً نزدیک نور. گیلاس را برای میز تحریر، کابینت و ذخیره‌سازی کوچک دوست داریم؛ جاهایی که سطح مهم است و می‌خواهید چوب متین باشد بدون تکلف. گیلاس از بلوط در برابر لب‌پریدگی کم‌تحمل‌تر است، پس برای اتاقی آرام‌تر مناسب‌تر است.</p>

<h2>توت ایرانی</h2>
<p>توت ایرانی یکی از بهترین چوب‌های سخت این منطقه است. متراکم، ریزدانه و از قهوه‌ای گرم تا بنفش‌قهوه‌ای تیره. برای قفسهٔ کتاب، مبلمان شاخص و کارهای چرخ‌کاری — کاسه، سینی و اشیای کوچک — عالی است. چون متراکم و پررگه است می‌تواند گران‌تر باشد، اما استفادهٔ با‌دقت را جبران می‌کند.</p>

<h2>نکته‌ای دربارهٔ پرداخت سطح</h2>
<p>پرداخت سطح به‌اندازهٔ خود چوب مهم است. بیشتر وقت‌ها از روغن موم مات یا ساتن استفاده می‌کنیم که سطح را محافظت می‌کند و در همان حال چوب را چوب‌گونه نگه می‌دارد. برای سطح‌هایی که مقاومت بیشتری لازم دارند — مثل میز تحریر — گاهی لایهٔ نازکی پلی‌اورتان ساتن می‌زنیم. هیچ‌کدام از این پرداخت‌ها نامرئی نیستند و همین نکتهٔ کار است: هدف، محافظت از چوب و خوانا ماندن آن است.</p>

<p>اگر مطمئن نیستید از کجا شروع کنید، اتاق و زندگی‌ای که در آن جریان دارد را برایمان بگویید. چوب درست معمولاً همان است که با عادت‌ها جور می‌شود، نه آن که در مقایسهٔ کاتالوگی برنده می‌شود.</p>
`,
        coverUrl:
          '/images/oak-dining-table-detail.webp',
        tags: ['راهنمای چوب', 'مبلمان', 'مواد'],
        authorId: 'admin-user',
      },
    }),
    prisma.post.create({
      data: {
        slug: 'how-we-finish-our-furniture',
        title: 'چگونه مبلمان‌مان را پرداخت می‌کنیم',
        excerpt:
          'نگاهی صادقانه به پرداخت‌هایی که استفاده می‌کنیم، اینکه چرا بیشتر وقت‌ها روغن موم مات را انتخاب می‌کنیم و با گذر زمان روی سطح خانهٔ شما چه اتفاقی می‌افتد.',
        content: `
<p>پرداخت سطح همان تفاوتی است که میان قطعه‌ای «دست‌ساز به نظر می‌رسد» و قطعه‌ای «دست‌ساز حس می‌شود» می‌نشیند. بیشتر مبلمان ما با روغن موم و درخشش مات یا ساتن پرداخت می‌شود و پلی‌اورتان ساتن را کم‌تر و فقط برای میزکار و سطح‌های پرکشش به کار می‌بریم.</p>

<h2>چرا روغن موم</h2>
<p>روغن‌های موم به چوب نفوذ می‌کنند و سطحی جا می‌گذارند که هنوز چوب حس می‌شود: گرم، کمی چسبان و صادق. نفس می‌کشند، ترمیم موضعی‌شان آسان است و طبیعی پیر می‌شوند، نه اینکه مثل بعضی پرداخت‌های لایه‌ای ترک بخورند و کنده شوند. برای میز غذاخوری یا نیمکت معمولاً همین چیزی است که می‌خواهید.</p>

<h2>با گذر زمان چه انتظاری داشته باشیم</h2>
<p>هیچ پرداختی ابدی نیست. روی سطح روغن‌خورده ردپای زندگی روزمره می‌ماند: حلقهٔ لیوان، خطی از انگشتر، درخشش نرم جاهایی که بیشتر دست می‌خورند. ما این را یک ویژگی می‌دانیم. این ردها قصه می‌گویند و چون پرداخت قابل ترمیم است، همیشگی نیستند. کمی سنباده و یک لایه روغن تازه، سطح را نزدیک به روز اول برمی‌گرداند.</p>

<h2>پلی‌اورتان، آن‌جا که منطقی است</h2>
<p>برای میزکار و هر سطحی که کشش مستقیم زیادی می‌بیند، گاهی لایهٔ نازکی پلی‌اورتان ساتن می‌زنیم. مقاومت بیشتری در برابر خط و ریخت‌وپاش دارد و روغن‌کاری دوره‌ای نمی‌خواهد. در عوض، کمی بیشتر شبیه لایه‌ای روی چوب به نظر می‌رسد و ترمیم موضعی‌اش سخت‌تر است. آن را آن‌جا به کار می‌بریم که کاربرد می‌طلبد، نه به‌طور پیش‌فرض.</p>

<h2>نگهداری</h2>
<p>سطح را از آب ماندگار دور نگه دارید، اشیا را روی آن بکشید نکنید بلکه بلند کنید و لیوان را روی زیرلیوانی بگذارید. برای سطح‌های روغن‌خورده، سالی یک یا دو بار تازه‌کردن سبک — در اتاق‌های کم‌رفت‌وآمد کمتر — حس نو بودن را برمی‌گرداند. راهنمایی دقیق محصول را هم می‌توانیم بگوییم.</p>
`,
        coverUrl:
          '/images/walnut-bench.webp',
        tags: ['صنعتگری', 'پرداخت سطح', 'نگهداری'],
        authorId: 'admin-user',
      },
    }),
    prisma.post.create({
      data: {
        slug: 'coffee-table-heights-and-living-room-scale',
        title: 'میز کنار، ارتفاع و مقیاس نشیمن',
        excerpt:
          'راهنمای کاربردی انتخاب میز کناری که با مبل، اتاق و شکل واقعی استفادهٔ شما جور باشد — بدون اینکه بیش از حد فکر کنید.',
        content: `
<p>میز کنار یکی از ساده‌ترین جاها برای اشتباه‌کردن است، چون همزمان سه کار دارد: نگه‌داشتن چیزهایی که رویش می‌گذارید، باز گذاشتن جا برای کارهایی که دورش می‌کنید، و به نظر رسیدن مثل بخشی از اتاق. رمز کار مقیاس، ارتفاع و کمی صداقت دربارهٔ شیوهٔ زندگی است.</p>

<h2>ارتفاع</h2>
<p>میز کنار باید نزدیک ارتفاع نشیمن مبل باشد، معمولاً کمی کوتاه‌تر. اگر خیلی بلندتر باشد، اتاق سنگین به نظر می‌رسد و میز جلوی نشستن را می‌گیرد. اگر خیلی کوتاه‌تر باشد، برای برداشتن کتاب یا کنترل مجبور می‌شوید دست‌تان را دراز کنید و بپیچانید. ارتفاع نشیمن مبل را اندازه بگیرید و میزی انتخاب کنید که نزدیک همان بنشیند، با یکی دو سانتی‌متر اختلاف.</p>

<h2>فاصله و رفت‌وآمد</h2>
<p>به‌قدر کافی جا بگذارید که بدون خوردن به ساق پا دور میز راه بروید. در اتاق کوچک، میزی کوتاه‌تر و باریک‌تر معمولاً بهتر از میزی بزرگ جواب می‌دهد که مثل مانع به نظر می‌رسد. در اتاق بزرگ آزادی بیشتری دارید، اما قاعده همان است: میز باید فضا را قاب بگیرد، نه با آن بجنگد.</p>

<h2>فرم</h2>
<p>میز گرد و بیضی در فضاهای تنگ و خانه‌های دارای کودک مهربان‌ترند، چون گوشهٔ کمتری برای برخورد دارند. میز مربع و مستطیل معمولاً بهتر کنار دیوار یا بین دو مبل می‌نشیند و لبهٔ کشیدهٔ تمیزتری به خط اتاق می‌دهد. فرم درست همگانی وجود ندارد؛ فقط فرمی وجود دارد که با اتاق و مسیر حرکت شما جور است.</p>

<h2>کاربرد</h2>
<p>فکر کنید در واقع چه چیزی روی میز می‌ماند: کتاب، سینی، چراغ، نوشیدنی، کاسه‌ای از چیزی. اگر میز شما بیشتر قفسه‌ای برای دسته‌ای کتاب است، مطمئن شوید به‌قدر کافی عمیق است که شلوغ به نظر نرسد. اگر میز را برای نوشیدنی و شام دونفره می‌خواهید، یک سینی دسته‌دار و سطحی که نگران رد شدن رویش نباشید ارزش هزینه‌اش را دارد.</p>

<p>میز کنار خوب، در زندگی اتاق حل می‌شود. این تعریف بالایی است.</p>
`,
        coverUrl:
          '/images/walnut-coffee-table.webp',
        tags: ['نشیمن', 'میز کنار', 'مقیاس'],
        authorId: 'admin-user',
      },
    }),
    prisma.post.create({
      data: {
        slug: 'wood-furniture-in-a-small-apartment',
        title: 'مبلمان چوبی در آپارتمان کوچک',
        excerpt:
          'چگونه با چند قطعهٔ خوبِ چوبی، آپارتمان کوچک را دلباز کنیم — و کدام انتخاب‌ها اتاق را کوچک‌تر از واقعیت نشان می‌دهند.',
        content: `
<p>آپارتمان کوچک همان جایی است که انتخاب‌های درست بیشترین اثر را دارند و انتخاب‌های اشتباه اول از همه خودشان را نشان می‌دهند. هدف این نیست که با کمترین چیز اتاق را پر کنیم — این کار فضای کوچک را خالی و موقتی نشان می‌دهد. هدف این است که قطعه‌هایی انتخاب کنیم که کارشان را بکنند بدون اینکه بیش از حق‌شان جا بخواهند.</p>

<h2>هر بار یک چیز</h2>
<p>در اتاق کوچک وسوسه‌کننده است که چند قطعهٔ کوچک پخش کنید، اما یک میزِ خوش‌تناسب معمولاً بیشتر از سه میز کوچک برای اتاق کار می‌کند. کارکرد اصلی اتاق را انتخاب کنید، یکی دو قطعه که همان کار را می‌کنند بردارید و بگذارید بقیه آرام باشند.</p>

<h2>پایه‌ها مهم‌اند</h2>
<p>مبلمانی که پایه‌های دیده‌شدنی دارد، می‌گذارد نور و خط دید از زیرش عبور کند و اتاق بازتر حس شود. یک میز کنارِ کوتاه با دامنهٔ باریک و پایه‌های مخروطی می‌تواند بسیار سبک‌تر از یک بلوک تو‌پُر با همان اندازه حس شود. این یکی از ساده‌ترین راه‌هاست برای اینکه اتاق کوچک، تنگ حس نشود.</p>

<h2>گرما، نه سنگینی</h2>
<p>چوب در آپارتمان کوچک سودمند است، چون گرما اضافه می‌کند بدون اینکه مثل بعضی مواد توجه بخواهد. یک میز کنار گردو می‌تواند خاص‌ترین چیز اتاق باشد و در همان حال آرام به نظر برسد. پرداخت‌های گرم را انتخاب کنید که زیاد تلاش نکنند؛ مات و ساتن در اتاق‌های کوچک بهتر از براقِ سنگین پیر می‌شوند.</p>

<h2>ذخیره‌سازی با هوا</h2>
<p>قفسه‌های باز می‌توانند زیبا باشند، اما در آپارتمان کوچک نظم هم می‌خواهند. اگر قرار نیست آن‌ها را مرتب و ویرایش‌شده نگه دارید، کابینتِ درب‌دار انتخاب مهربان‌تری است. اگر قفسهٔ باز دوست دارید، چند چیزِ عمدی در آن بگذارید، نه همه‌چیز را با هم. هدف این است که چشم جایی خوش برای استراحت پیدا کند، نه اینکه بیشتر بخواند.</p>

<h2>سطح‌ها را ویرایش کنید</h2>
<p>سریع‌ترین راه آرام‌تر کردن یک آپارتمان کوچک، کم‌کردن چیزهایی است که روی هر سطح نشسته‌اند. نه همه‌چیز — فقط به‌قدر کافی. میز کنار خالی، میزکار مرتب و یک سینی برای جمع‌کردن ریزه‌ها: این تصمیم‌های کوچک بیشتر از تعویض بیشتر مبلمان، حس اتاق را عوض می‌کنند.</p>

<p>آپارتمان کوچک فکر کوچک نمی‌خواهد؛ مبلمانی می‌خواهد که با فضا و زندگی درونش جور باشد و این کار را بدون داد و فریاد بکند.</p>
`,
        coverUrl:
          '/images/oak-dresser.webp',
        tags: ['فضاهای کوچک', 'آپارتمان', 'مبلمان چوبی'],
        authorId: 'admin-user',
      },
    }),
    prisma.post.create({
      data: {
        slug: 'why-persian-oak-still-matters',
        title: 'چرا بلوط ایرانی هنوز مهم است',
        excerpt:
          'نامه‌ای عاشقانه به بلوط ایرانی: چرا این چوب سخت منطقه‌ای همچنان راهش را به میزها، صندلی‌ها و نیمکت‌های ما پیدا می‌کند و چه کاری را بهتر از گزینه‌های دیگر انجام می‌دهد.',
        content: `
<p>بلوط ایرانی ساده‌ترین چوب برای کار نیست و درخشان‌ترین نام صفحهٔ محصول هم نیست. آن جذابیت فوری گردوی سیاه یا سرخی گیلاس را ندارد. چیزی که دارد یکدستی، دوام و زیبایی آرامی است که هرچه بیشتر با آن زندگی کنید بهتر می‌شود. به همین دلیل هنوز برای ما مهم است.</p>

<h2>یک مادهٔ منطقه‌ای</h2>
<p>بلوط ایرانی بومی بخش‌هایی از همین منطقه است و نسل‌هاست در مبلمان و نجاری این‌جا به کار می‌رود. استفاده از آن بخشی از یک سنت طولانی‌تر است: ساختن مبلمان از چوبی که همین نزدیکی می‌روید. این ارزش واقعی دارد — نه فقط به‌خاطر حس نوستالژیک، بلکه به‌خاطر زنجیرهٔ تأمین، کار محلی و خودِ ماده.</p>

<h2>جنس ماده</h2>
<p>بلوط ایرانی متراکم، قوی و بادوام است. رگهٔ آن معمولاً راست و صادق است و پرداخت را خوب می‌پذیرد، مخصوصاً روغن موم مات یا ساتن که سطح را قابل لمس می‌گذارد. رنگ آن بین قهوه‌ای گرم و کهربایی می‌نشیند و همین باعث می‌شود بدون ادعای قطعهٔ شاخص بودن، به اتاق‌های زیادی بخورد. در برابر استفاده هم بخشنده است؛ لب‌پریدگی‌ها به قصهٔ قطعه تبدیل می‌شوند، نه زخم.</p>

<h2>کجا استفاده می‌کنیم</h2>
<p>بلوط ایرانی را بیشتر برای میز و صندلی به کار می‌بریم — قطعه‌هایی که زندگی روزمره را می‌بینند و باید تحملش کنند. برای صفحهٔ میز و بدنهٔ صندلی به‌قدر کافی قوی است و در اتاقی که برای زندگی‌کردن ساخته شده، نه فقط نگاه‌کردن، درست به نظر می‌رسد. اگر میز غذاخوری می‌خواهید که هر شب استفاده شود و ده سال بعد هم خوب باشد، بلوط پاسخ بسیار خوبی است.</p>

<h2>چیزی که دربارهٔ آن دوست داریم</h2>
<p>بیشتر از هر چیز، صداقت بلوط ایرانی را دوست داریم. ادعای چیز دیگری را ندارد. مثل چوب به نظر می‌رسد، مثل چوب کار می‌کند و مثل چوب پیر می‌شود — و برای ماده‌ای که راضی است خودش باشد، حرف زیادی می‌توان گفت.</p>
`,
        coverUrl:
          '/images/mulberry-bookshelf.webp',
        tags: ['بلوط ایرانی', 'مواد', 'صنعتگری'],
        authorId: 'admin-user',
      },
    }),
  ]);

  console.log('[seed] پایان.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
