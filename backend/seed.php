<?php
/**
 * Rootwood Group — Database Seed Script
 * Run from CLI: php seed.php
 * Or executes via HTTP in development when authorized.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function uuidv4(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function run_seed(): void {
    $pdo = get_db();
    echo "Seeding database...\n";

    // Disable foreign keys during wipe
    $pdo->exec("SET foreign_key_checks = 0");
    $tables = [
        'contact_messages', 'posts', 'reviews', 'cart_items', 'carts',
        'payment_transactions', 'order_items', 'orders', 'addresses',
        'product_images', 'products', 'categories', 'otp_codes', 'users'
    ];
    foreach ($tables as $t) {
        $pdo->exec("TRUNCATE TABLE `$t`");
    }
    $pdo->exec("SET foreign_key_checks = 1");

    $defaultPasswordHash = password_hash('CraftedRoot!2026', PASSWORD_BCRYPT, ['cost' => 12]);

    // 1. Users
    $adminId = uuidv4();
    $customerId = uuidv4();

    $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$adminId, 'hello@craftedroot.com', $defaultPasswordHash, 'مدیر کارگاه (آرش)', '09121111111', 'ADMIN']);
    $stmt->execute([$customerId, 'arash@craftedroot.com', $defaultPasswordHash, 'آرش صادقی', '09122222222', 'CUSTOMER']);

    echo "✓ Users seeded\n";

    // 2. Categories
    $categories = [
        ['slug' => 'tables', 'name' => 'میزها', 'desc' => 'میزهای ناهارخوری، جلو مبلی و تحریر از بلوط و گردو', 'sort' => 1],
        ['slug' => 'seating', 'name' => 'نشیمن', 'desc' => 'صندلی‌ها و نیمکت‌های ارگونومیک دست‌ساز با چوب طبیعی', 'sort' => 2],
        ['slug' => 'storage', 'name' => 'کمد و قفسه', 'desc' => 'کتابخانه، دراور و کنسول با اتصالات سنتی نجاری', 'sort' => 3],
        ['slug' => 'decor', 'name' => 'اکسسوری و دکور', 'desc' => 'کاسه‌های خراطی، سینی و ظروف چوبی با پوشش کاملاً خوراکی', 'sort' => 4],
    ];

    $catMap = [];
    $stmt = $pdo->prepare("INSERT INTO categories (id, slug, name, description, sort_order) VALUES (?, ?, ?, ?, ?)");
    foreach ($categories as $c) {
        $id = uuidv4();
        $stmt->execute([$id, $c['slug'], $c['name'], $c['desc'], $c['sort']]);
        $catMap[$c['slug']] = $id;
    }

    echo "✓ Categories seeded\n";

    // 3. Products
    $products = [
        [
            'slug' => 'persian-oak-dining-table',
            'name' => 'میز غذاخوری بلوط ایرانی',
            'tagline' => 'میز ناهارخوری هشت‌نفره با چوب بلوط جنگل‌های زاگرس',
            'desc' => 'ساخته‌شده از الوارهای یکپارچه بلوط کهنسال زاگرس با پرداخت روغن گیاهی خالص. مقاومت بی‌نظیر در برابر رطوبت و خط و خش، لبه‌های طبیعی نرم‌شده و پایه‌های مستحکم دوبل.',
            'price' => 28500000,
            'compare' => 32000000,
            'sku' => 'TAB-OAK-01',
            'stock' => 4,
            'cat' => 'tables',
            'wood' => 'بلوط ایرانی',
            'finish' => 'روغن گیاهی طبیعی ضد رطوبت',
            'dim' => '۲۲۰ × ۹۵ × ۷۶ سانتی‌متر',
            'weight' => 74.0,
            'featured' => 1,
            'images' => [
                ['url' => '/images/oak-dining-table.webp', 'alt' => 'میز غذاخوری بلوط ایرانی در دکور اتاق ناهارخوری', 'sort' => 1],
                ['url' => '/images/oak-dining-table-detail.webp', 'alt' => 'جزئیات رگه‌های چوب بلوط ایرانی روی سطح میز', 'sort' => 2],
            ]
        ],
        [
            'slug' => 'walnut-coffee-table',
            'name' => 'میز جلو مبلی گردوی تیره',
            'tagline' => 'میز عسلی با بافت شکلاتی و خطوط مینیمال ژاپنی',
            'desc' => 'چوب گردوی کهنسال با مغز تیره شکلاتی و گره‌های مواج هنری. این میز جلو مبلی نقطه‌ی کانونی اتاق نشیمن شما خواهد بود.',
            'price' => 14200000,
            'compare' => 16500000,
            'sku' => 'TAB-WAL-02',
            'stock' => 6,
            'cat' => 'tables',
            'wood' => 'گردوی آمریکایی',
            'finish' => 'واکس زنبور عسل و روغن کتان',
            'dim' => '۱۲۰ × ۶۵ × ۴۲ سانتی‌متر',
            'weight' => 28.5,
            'featured' => 1,
            'images' => [
                ['url' => '/images/walnut-coffee-table.webp', 'alt' => 'میز جلو مبلی گردوی تیره', 'sort' => 1],
            ]
        ],
        [
            'slug' => 'cherry-writing-desk',
            'name' => 'میز تحریر مینیمال گیلاس',
            'tagline' => 'طراحی ارگونومیک با کشوی مخفی ابریشمی',
            'desc' => 'چوب گیلاس اصیل با رنگ کهربایی مایل به سرخ، بافتی یکدست و لمسی گرم و ابریشمی. ایده‌آل برای اتاق مطالعه یا دفتر کار خانگی.',
            'price' => 19800000,
            'compare' => null,
            'sku' => 'TAB-CHR-03',
            'stock' => 3,
            'cat' => 'tables',
            'wood' => 'گیلاس اصیل',
            'finish' => 'روغن دانمارکی مات',
            'dim' => '۱۴۰ × ۷۰ × ۷۵ سانتی‌متر',
            'weight' => 36.0,
            'featured' => 1,
            'images' => [
                ['url' => '/images/cherry-writing-desk.webp', 'alt' => 'میز تحریر مینیمال گیلاس', 'sort' => 1],
                ['url' => '/images/cherry-writing-desk-detail.webp', 'alt' => 'جزئیات اتصالات چوب گیلاس', 'sort' => 2],
            ]
        ],
        [
            'slug' => 'oak-dining-chair',
            'name' => 'صندلی غذاخوری ارگونومیک بلوط',
            'tagline' => 'پشتی قوسی دست‌ساز با حداکثر راحتی ستون فقرات',
            'desc' => 'صندلی غذاخوری ساخته شده از چوب فشرده بلوط ایرانی با فرم‌دهی قوسی که وزن بدن را کاملاً تعدیل می‌کند.',
            'price' => 5600000,
            'compare' => null,
            'sku' => 'SEA-OAK-01',
            'stock' => 12,
            'cat' => 'seating',
            'wood' => 'بلوط ایرانی',
            'finish' => 'روغن طبیعی گیاهی',
            'dim' => '۵۲ × ۴۸ × ۸۴ سانتی‌متر',
            'weight' => 6.8,
            'featured' => 1,
            'images' => [
                ['url' => '/images/oak-dining-chair.webp', 'alt' => 'صندلی غذاخوری ارگونومیک بلوط', 'sort' => 1],
            ]
        ],
        [
            'slug' => 'walnut-milk-bench',
            'name' => 'نیمکت ورودی گردوی دست‌ساز',
            'tagline' => 'نیمکت سنتی سبک شیکر با لبه‌های زنده',
            'desc' => 'نیمکتی همه‌کاره برای ورودی، پای تخت خواب یا پشت میز ناهارخوری. استحکام بالا با اتصالات کام و زبانه دوبل سنتی.',
            'price' => 9400000,
            'compare' => 11000000,
            'sku' => 'SEA-WAL-02',
            'stock' => 5,
            'cat' => 'seating',
            'wood' => 'گردوی آمریکایی',
            'finish' => 'روغن گیاهی مات',
            'dim' => '۱۳۰ × ۳۵ × ۴۵ سانتی‌متر',
            'weight' => 18.0,
            'featured' => 0,
            'images' => [
                ['url' => '/images/walnut-bench.webp', 'alt' => 'نیمکت ورودی گردوی دست‌ساز', 'sort' => 1],
            ]
        ],
        [
            'slug' => 'mulberry-bookshelf',
            'name' => 'کتابخانه چهار طبقه توت کهنسال',
            'tagline' => 'بافت کاراملی متراکم با استحکام تاریخی',
            'desc' => 'کتابخانه‌ای باشکوه ساخته شده از چوب کهنسال درخت توت با دوام فوق‌العاده در برابر تاب‌برداشتگی و موریانه.',
            'price' => 26000000,
            'compare' => 29500000,
            'sku' => 'STO-MUL-01',
            'stock' => 2,
            'cat' => 'storage',
            'wood' => 'توت کهنسال',
            'finish' => 'واکس طبیعی چوب',
            'dim' => '۱۰۰ × ۳۲ × ۱۸۰ سانتی‌متر',
            'weight' => 52.0,
            'featured' => 1,
            'images' => [
                ['url' => '/images/mulberry-bookshelf.webp', 'alt' => 'کتابخانه چهار طبقه توت کهنسال', 'sort' => 1],
            ]
        ],
        [
            'slug' => 'oak-dresser',
            'name' => 'دراور چهار کشو بلوط مینیمال',
            'tagline' => 'ریل‌های چوبی سنتی بدون قطعات فلزی مستهلک‌شونده',
            'desc' => 'دراور ظریف با چهار کشوی عمیق، اتصالات دم‌چلچله‌ای در گوشه‌ها و ریل‌های روان چوب به چوب که مادام‌العمر کار می‌کنند.',
            'price' => 22500000,
            'compare' => null,
            'sku' => 'STO-OAK-02',
            'stock' => 3,
            'cat' => 'storage',
            'wood' => 'بلوط ایرانی',
            'finish' => 'روغن گیاهی محافظ',
            'dim' => '۹۰ × ۴۵ × ۱۰۵ سانتی‌متر',
            'weight' => 48.0,
            'featured' => 0,
            'images' => [
                ['url' => '/images/oak-dresser.webp', 'alt' => 'دراور چهار کشو بلوط مینیمال', 'sort' => 1],
            ]
        ],
        [
            'slug' => 'walnut-serving-tray',
            'name' => 'سینی پذیرایی لبه منحنی گردو',
            'tagline' => 'یکپارچه تراشیده‌شده از الوار منفرد',
            'desc' => 'سینی پذیرایی نفیس بدون هیچ‌گونه چسب یا اتصال؛ مستقیماً از یک تخته چوب گردوی درجه یک خراطی و سیقل داده شده است.',
            'price' => 1850000,
            'compare' => null,
            'sku' => 'DEC-WAL-01',
            'stock' => 20,
            'cat' => 'decor',
            'wood' => 'گردوی آمریکایی',
            'finish' => 'روغن خوراکی کاملاً بی‌خطر',
            'dim' => '۴۵ × ۲۸ × ۳ سانتی‌متر',
            'weight' => 1.4,
            'featured' => 0,
            'images' => [
                ['url' => '/images/walnut-serving-tray.webp', 'alt' => 'سینی پذیرایی لبه منحنی گردو', 'sort' => 1],
            ]
        ],
        [
            'slug' => 'mulberry-bowl',
            'name' => 'کاسه خراطی توت کهنسال',
            'tagline' => 'اثر هنری دست‌ساز با خطوط دوار طبیعی',
            'desc' => 'کاسه خراطی کار دست با رگه‌های طلایی-کاراملی خیره‌کننده. مناسب سرو خشکبار، میوه یا جلوه‌بخشی به میز پذیرایی.',
            'price' => 1450000,
            'compare' => null,
            'sku' => 'DEC-MUL-02',
            'stock' => 15,
            'cat' => 'decor',
            'wood' => 'توت کهنسال',
            'finish' => 'روغن بَزرک خوراکی و موم عسل',
            'dim' => 'قطر ۲۴ سانتی‌متر، ارتفاع ۹ سانتی‌متر',
            'weight' => 0.95,
            'featured' => 0,
            'images' => [
                ['url' => '/images/mulberry-bowl.webp', 'alt' => 'کاسه خراطی توت کهنسال', 'sort' => 1],
            ]
        ]
    ];

    $prodStmt = $pdo->prepare("INSERT INTO products (id, slug, name, tagline, description, price, compare_at, sku, stock, category_id, wood_type, finish, dimensions, weight_kg, featured, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    $imgStmt = $pdo->prepare("INSERT INTO product_images (id, product_id, url, alt, sort_order) VALUES (?, ?, ?, ?, ?)");
    $prodMap = [];

    foreach ($products as $p) {
        $pId = uuidv4();
        $prodMap[$p['slug']] = $pId;
        $prodStmt->execute([
            $pId, $p['slug'], $p['name'], $p['tagline'], $p['desc'],
            $p['price'], $p['compare'], $p['sku'], $p['stock'],
            $catMap[$p['cat']], $p['wood'], $p['finish'], $p['dim'],
            $p['weight'], $p['featured']
        ]);

        foreach ($p['images'] as $img) {
            $imgStmt->execute([uuidv4(), $pId, $img['url'], $img['alt'], $img['sort']]);
        }
    }

    echo "✓ Products & Images seeded\n";

    // 4. Reviews
    $reviews = [
        [
            'slug' => 'persian-oak-dining-table',
            'rating' => 5,
            'title' => 'کیفیت ساخت فراتر از انتظار',
            'comment' => 'میز بلوط به دستمون رسید. لمس چوب و بوی روغن گیاهی فوق‌العاده‌ست. بسته‌بندی پالت چوبی هم کاملاً حرفه‌ای بود.',
            'author' => 'سارا محمدی',
            'verified' => 1,
            'approved' => 1,
        ],
        [
            'slug' => 'persian-oak-dining-table',
            'rating' => 5,
            'title' => 'واقعاً یک اثر هنری ماندگار',
            'comment' => 'رگه‌های طبیعی چوب بلوط شگفت‌انگیزه. پایه‌ها به شدت سنگین و محکم هستن و اصلاً لرزش نداره.',
            'author' => 'دکتر کاظمی',
            'verified' => 1,
            'approved' => 1,
        ],
        [
            'slug' => 'walnut-coffee-table',
            'rating' => 5,
            'title' => 'رنگ شکلاتی بی‌نظیر',
            'comment' => 'دقیقاً همون چیزی بود که برای سالن نشیمن نیاز داشتیم. بافت گردو واقعاً ابریشمیه.',
            'author' => 'نیما رضایی',
            'verified' => 1,
            'approved' => 1,
        ]
    ];

    $revStmt = $pdo->prepare("INSERT INTO reviews (id, product_id, user_id, author_name, rating, title, comment, verified_purchase, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($reviews as $r) {
        $revStmt->execute([
            uuidv4(), $prodMap[$r['slug']], $customerId, $r['author'],
            $r['rating'], $r['title'], $r['comment'], $r['verified'], $r['approved']
        ]);
    }

    echo "✓ Reviews seeded\n";

    // 5. Blog Posts
    $posts = [
        [
            'slug' => 'choosing-the-right-wood-for-your-home',
            'title' => 'چگونه گونه چوب مناسب خانه خود را انتخاب کنیم؟',
            'excerpt' => 'راهنمای مقایسه بلوط، گردو، گیلاس و توت از نظر تراکم، رنگ‌پذیری و هارمونی در دکوراسیون داخلی.',
            'cover' => '/images/oak-dining-table-detail.webp',
            'tags' => json_encode(['چوب', 'راهنمای خرید', 'دکوراسیون']),
            'content' => "انتخاب متریال چوب برای مبلمان دائمی یکی از مهم‌ترین تصمیمات در طراحی فضای زندگی است. هر گونه چوب، قصه و کاراکتر خاص خودش را دارد...\n\n### بلوط ایرانی\nبلوط با تراکم بالا، رنگ کرم-عسلی و رگه‌های قدرتمندش، انتخابی ماندگار برای میزهای غذاخوری پرکاربرد است.\n\n### گردوی تیره\nبرای فضاهایی با نور ملایم و حس تجمل مدرن، بافت مخملی چوب گردو بی‌همتاست."
        ],
        [
            'slug' => 'how-we-finish-our-furniture',
            'title' => 'چرا فقط از پرداخت روغن گیاهی خالص استفاده می‌کنیم؟',
            'excerpt' => 'تفاوت پوشش‌های سنتی شیمیایی پلی‌استر و سیلر با روغن‌های گیاهی نفوذگر غیرسمی.',
            'cover' => '/images/workshop.webp',
            'tags' => json_encode(['کارگاه', 'روغن گیاهی', 'سلامت']),
            'content' => "در کارگاه روت‌وود، سلامت خانواده‌ها در اولویت اول قرار دارد. پوشش‌های متداول شیمیایی تنفس چوب را مسدود می‌کنند، در حالی که ترکیب موم زنبور عسل و روغن‌های گیاهی ارگانیک حس گرم و طبیعی چوب را زنده نگه می‌دارند."
        ],
        [
            'slug' => 'coffee-table-heights-and-living-room-scale',
            'title' => 'اندازه و ارتفاع استاندارد میز جلو مبلی متناسب با کاناپه',
            'excerpt' => 'تناسبات طلایی چیدمان نشیمن: ارتفاع سطح میز، فاصله رفت‌وآمد و هماهنگی بصری.',
            'cover' => '/images/walnut-coffee-table.webp',
            'tags' => json_encode(['طراحی داخلی', 'نکات چیدمان']),
            'content' => "میز جلو مبلی نباید صرفاً یک المان دکوری باشد، بلکه مرکز تعامل در اتاق نشیمن است. ارتفاع سطح میز باید بین ۳ تا ۵ سانتی‌متر پایین‌تر از ارتفاع تشک نشیمنگاه مبل قرار گیرد..."
        ]
    ];

    $postStmt = $pdo->prepare("INSERT INTO posts (id, slug, title, excerpt, content, cover_image, author_id, published, tags) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)");
    foreach ($posts as $p) {
        $postStmt->execute([
            uuidv4(), $p['slug'], $p['title'], $p['excerpt'],
            $p['content'], $p['cover'], $adminId, $p['tags']
        ]);
    }

    echo "✓ Blog posts seeded\n";

    // 6. Customer Address
    $addrStmt = $pdo->prepare("INSERT INTO addresses (id, user_id, full_name, line1, line2, city, state, postal_code, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    $addrStmt->execute([
        uuidv4(), $customerId, 'آرش صادقی', 'خیابان ولیعصر، بالاتر از پارک ساعی، کوچه ساعی دوم، پلاک ۱۲',
        'واحد ۴', 'تهران', 'تهران', '1511833111', '09122222222'
    ]);

    echo "✓ Customer address seeded\n";

    echo "Seeding completed successfully!\n";
}

if (php_sapi_name() === 'cli' || isset($_GET['seed_now'])) {
    run_seed();
}
