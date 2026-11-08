# Rootwood Group — PHP + MySQL Backend

A clean, modern, and hardened **PHP 8+ REST API** backed by **MySQL 8.0 (PDO)** for Rootwood Group / CraftedRoot.

## Security Highlights

1. **Prepared Statements**: Real PDO prepared statements with `PDO::ATTR_EMULATE_PREPARES => false`. Zero SQL injection.
2. **Hardened OTP**:
   - Cryptographic 6-digit codes generated using `random_int(100000, 999999)`.
   - Stored hashed via HMAC-SHA256 (`hash_hmac`). Plaintext codes are never stored.
   - Max 5 failed attempts before the code is permanently burned.
   - Rate limited to at most 5 requests per 10 minutes per identifier.
   - 120-second TTL.
   - In production (`APP_ENV=production`), codes are strictly never returned in API responses.
3. **Hardened Payment Flow**:
   - Gateways: Zarinpal v4, Zibal, and Dev Simulated.
   - Simulation gateway is strictly disabled in production.
   - Unconfigured gateways reject immediately (never auto-mark orders as paid).
   - Server-derived `callbackUrl` prevents open redirect and phishing.
   - Server-side amount validation against order total (`Toman * 10` for Rial gateways).
   - Atomic settlement and idempotent callback receipts.
4. **Server-Side Pricing & Inventory Concurrency**:
   - Order prices are fetched strictly from the database `products` table. Client-side price tampering is impossible.
   - Atomic stock decrement with check: `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`.
   - Cancellation restores reserved stock atomically inside a database transaction.
5. **IDOR Safe Access**:
   - Customer orders, addresses, and profiles strictly require `user_id === auth_user_id` (or `ADMIN` role).
6. **Admin Authorization**:
   - Dashboard summary, order status triage, review moderation, and contact messages require `role === 'ADMIN'`.
7. **Review Moderation**:
   - Customer reviews are submitted with `approved = 0` and verified-purchase checks. Only published after admin approval.

## Requirements

- PHP 8.1+ with extensions: `pdo`, `pdo_mysql`, `curl`, `json`
- MySQL 8.0+ or MariaDB 10.5+
- Apache (with `mod_rewrite` and `mod_headers`) or Nginx

## Quick Setup

### Option 1: Docker (Recommended)
```bash
docker compose up -d
# Seed the database
docker compose exec api php /var/www/html/api/seed.php
```
The API is available at `http://localhost:8000/api`.

### Option 2: Local PHP & MySQL / cPanel
1. Import `schema.sql` into your MySQL database:
   ```bash
   mysql -u root -p rootwood < backend/schema.sql
   ```
2. Copy `.env.example` to `.env` and fill in your DB credentials:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Run the seed script:
   ```bash
   php backend/seed.php
   ```
4. Start the local server:
   ```bash
   php -S 127.0.0.1:8000 -t backend
   ```
