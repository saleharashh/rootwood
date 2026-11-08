# Rootwood Group · روت‌وود گروپ

A production-shaped e-commerce portfolio project for a small Persian woodworking workshop: a fast, accessible **RTL storefront** plus an operational **admin dashboard**, built as a pnpm monorepo.

> **Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · NestJS 11 · Prisma 7 · PostgreSQL · Jest · Playwright · axe-core

![CraftedRoot storefront](docs/screenshots/01-home-desktop.jpg)

## Why this project exists

Most portfolio storefronts stop at a pretty landing page and a mocked cart. CraftedRoot models the full loop a real workshop needs: browsing a catalog, guest-to-customer cart conversion, checkout, order tracking, verified reviews, content marketing, and an admin workspace for orders, stock, moderation and support.

The UI is entirely in Persian with right-to-left layout, local product photography, and an elegant, minimalist craft atelier design language. The backend is a real REST API with database constraints, transactional stock handling, role-based access control, hardened one-time-code login, real Iranian payment gateways, and an end-to-end test suite.

The storefront is a **server-rendered Next.js application** (not a static export): catalog search, filters, sorting and pagination are resolved on the server from URL query parameters, so every result is shareable, crawlable and fast on first paint. One Node process serves the storefront, and a single NestJS service is the only backend.

## What is inside

### Storefront

- Server-rendered catalog with URL-driven search, category/wood filters, price range, sorting and pagination
- Product pages with galleries, specifications, stock state and related pieces
- Guest cart backed by an HTTP-only session identity, merged into the account cart on sign-in
- Checkout with saved/new addresses, shipping rules, Zarinpal/Zibal payment and an order confirmation page
- Customer account: profile, password, addresses, orders and order details
- Verified-purchase reviews with moderation before publication
- Blog/journal with server-rendered tags, search, pagination and related posts
- Contact and bespoke-furniture inquiry forms
- Persian/Jalali dates, Persian numerals and RTL-first components

### Admin dashboard (`/admin`, role-gated)

- KPI cards for approved revenue, orders, customers and open work
- Seven-day sales chart, order-status distribution, low-stock list and recent orders
- Order search, status filters, pagination, valid status transitions and cancellation with stock restoration
- Review moderation queue (approve / unpublish)
- Contact-ticket triage (new → in progress → resolved)
- Server page is `noindex` and blocked in `robots.txt`

### Platform

- JWT authentication in an HttpOnly, SameSite cookie; `tokenVersion` invalidates sessions on logout and password change
- Passwordless OTP login backed by the database: HMAC-SHA256 digests, 6-digit `crypto.randomInt` codes, 2-minute TTL, 5 attempts, 5 sends per 10 minutes, single use
- Global auth guard with public-route and role decorators; IDOR-safe order/review/address access
- Passwords hashed with bcrypt; DTO validation via class-validator; HTML sanitization for user content
- Real payment gateways (Zarinpal, Zibal) with server-side verification, amount checks, idempotent settlement and a Toman→Rial conversion in one place
- Helmet, strict CORS, rate limiting and proxy-aware deployment settings
- Prisma transactions for stock decrement/restore and order creation
- SSR catalog and journal (dynamic per request); long-lived cache only for truly static assets
- Locally bundled WebP imagery through `next/image`; no third-party image hosts at runtime
- Jest + Supertest API suite against an isolated `_test` database
- Playwright functional, security-header and WCAG 2 A/AA axe checks
- GitHub Actions for lint, types, unit, API e2e, browser/accessibility e2e and production builds

## Screenshots

| Storefront | Admin dashboard |
| --- | --- |
| ![Storefront home](docs/screenshots/01-home-desktop.jpg) | ![Admin dashboard](docs/screenshots/06-admin-dashboard.jpg) |

<details>
<summary>More screenshots</summary>

| Catalog | Product detail |
| --- | --- |
| ![Catalog](docs/screenshots/02-products.jpg) | ![Product detail](docs/screenshots/03-product-detail.jpg) |

| Journal | Contact |
| --- | --- |
| ![Journal](docs/screenshots/04-blog.jpg) | ![Contact](docs/screenshots/05-contact.jpg) |

| Mobile storefront |
| --- |
| ![Mobile home](docs/screenshots/07-home-mobile.jpg) |

</details>

## Architecture

```mermaid
flowchart LR
  subgraph Client
    BROWSER["Browser<br/>RTL · React 19 · Tailwind 4"]
  end
  subgraph Web["Next.js 16 Node server (SSR)"]
    RSC["Server Components<br/>catalog · journal · SEO"]
    PROXY["/api rewrite<br/>same-origin proxy"]
    ADMIN["Admin dashboard<br/>role-gated"]
  end
  subgraph Server
    API["NestJS 11 REST API"]
    DB[("PostgreSQL<br/>Prisma 7")]
  end
  BROWSER -->|HTML + RSC payload| RSC
  BROWSER -->|fetch + HttpOnly cookie| PROXY
  PROXY --> API
  RSC -->|server fetch| API
  ADMIN -->|fetch + HttpOnly cookie| PROXY
  API -->|transactional queries| DB
```

The browser talks to `/api` on the storefront origin and Next.js rewrites those requests to the NestJS API, so cookies stay first-party. React Server Components call the API directly over the private network. If the API lives on its own domain, set `NEXT_PUBLIC_API_URL` to that absolute origin instead and configure `CORS_ORIGINS` accordingly.

### Repository layout

```text
.
├─ apps/
│  ├─ web/                     # Next.js 16 App Router storefront + admin (SSR Node server)
│  │  ├─ app/                  # routes, Persian RTL layout, server-side filters
│  │  ├─ components/           # cart, auth, dialogs, product cards…
│  │  ├─ lib/api.ts            # typed API client + server/client base resolution
│  │  ├─ e2e/                  # Playwright + axe specs and screenshots
│  │  └─ next.config.ts        # security headers, /api proxy, image policy
│  └─ api/                     # NestJS 11 API (the only backend)
│     ├─ src/                  # auth/OTP, catalog, cart, orders, payments, reviews, admin…
│     ├─ prisma/               # schema, migrations, idempotent demo seed
│     └─ test/                 # Jest + Supertest e2e and test-db tooling
├─ docs/
│  ├─ screenshots/
│  └─ case-study.fa.md         # Persian case study
├─ .github/workflows/ci.yml
└─ package.json
```

### Data model (summary)

`User` → `Address`, `Order`, `Review`, `Cart`, `ContactMessage`; `Product` → `ProductImage`, `Review`, `CartItem`, `OrderItem`; `Category` → `Product`; `BlogPost` → `BlogPostTag`; `Order` → `OrderItem`, `PaymentTransaction`; `OtpCode` stores hashed one-time login codes.

Order totals are stored on the order, line items keep a product-name and unit-price snapshot, and order status transitions are validated server-side. All prices are stored in **Toman**; the single conversion to Rial happens inside `PaymentService` when a gateway request is made.

## Quick start

### Prerequisites

- Node.js **20.9+** (CI uses 22)
- pnpm **11**
- PostgreSQL **15+**

### 1. Install

```bash
pnpm install
```

### 2. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Required keys:

| Key | Example / notes |
| --- | --- |
| `DATABASE_URL` | `postgresql://postgres:password@127.0.0.1:5432/rootwood?schema=public` |
| `JWT_SECRET` | Random string, **32+ characters** |
| `PORT` | `3001` |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` |
| `NEXT_PUBLIC_SITE_URL` | Public storefront origin; used to build payment callbacks |

Optional keys:

| Key | Purpose |
| --- | --- |
| `JWT_EXPIRES_IN` | Token lifetime, default `1d` |
| `OTP_SECRET` | Dedicated HMAC secret for OTP digests; falls back to `JWT_SECRET` |
| `KAVENEGAR_API_KEY` / `KAVENEGAR_SENDER` | SMS delivery for phone OTP and order updates |
| `KAVENEGAR_TEMPLATE_*` | Kavenegar template names for verify/order messages |
| `RESEND_API_KEY` / `MAIL_FROM` | Transactional email (used for email OTP) |
| `MAIL_REPLY_TO` | Optional Reply-To for transactional email |
| `ZARINPAL_MERCHANT_ID` / `ZARINPAL_SANDBOX` | Zarinpal credentials; sandbox must stay `true` outside production |
| `ZIBAL_MERCHANT` / `ZIBAL_SANDBOX` | Zibal credentials; the public `zibal` merchant is sandbox-only |
| `PAYMENT_SIMULATION` | `true` enables the local simulator **only when `NODE_ENV !== production`** |
| `ORDER_EXPIRY_ENABLED` | Enables the abandoned-order stock release job (default: on in production) |
| `ORDER_EXPIRY_HOURS` | Age after which an unpaid order is cancelled, default `24` |
| `ORDER_EXPIRY_INTERVAL_MS` | Sweep interval, default `900000` (15 minutes) |
| `AUTH_COOKIE_SAME_SITE` | `lax`, `strict` or `none` (cross-site deployments) |
| `AUTH_COOKIE_SECURE` | Override secure-cookie detection |
| `AUTH_COOKIE_DOMAIN` | Parent domain for cookies |
| `TRUST_PROXY` | Set `true` behind Railway/Render/Fly |
| `SEED_DEMO_PASSWORD` | Password assigned to seeded demo accounts |
| `SEED_ALLOW_PRODUCTION` | Required, together with `NODE_ENV=production`, to run the destructive demo seed |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 3. Configure the web app

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Key | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public API origin seen by the browser. Use `/api` to go through the same-origin rewrite |
| `API_URL` | Server-side API origin for React Server Components (defaults to `http://127.0.0.1:3001`) |
| `API_PROXY_TARGET` | Upstream origin for the `/api` rewrite; required when `NEXT_PUBLIC_API_URL=/api` |
| `NEXT_PUBLIC_SITE_URL` | Canonical storefront origin used by metadata, sitemap, robots and payment callbacks |

### 4. Migrate and seed

```bash
pnpm --filter api prisma:deploy
pnpm db:seed
```

The seed resets storefront tables and creates a complete demo dataset: 10 products, 4 categories, 5 journal posts, 6 orders across every status, approved and pending reviews, customer/admin carts, addresses and 5 support tickets. Running it against a real database is destructive by design.

### 5. Run

```bash
pnpm dev
```

- Web: <http://localhost:3000>
- API: <http://localhost:3001>
- Health: <http://localhost:3001/health>

## Demo accounts

The seed creates one admin and three customers:

| Role | Email |
| --- | --- |
| Admin | `hello@craftedroot.com` |
| Customer | `nadia@example.com` |
| Customer | `reza@example.com` |
| Customer | `mina@example.com` |

**Password:** the value of `SEED_DEMO_PASSWORD`. In local development the seed falls back to `CraftedRoot!2026`; always set a dedicated value for a deployed demo and never reuse it for real accounts.

### Reviewer tour

1. Add a product to the cart while signed out.
2. Open the cart, sign in as Nadia, and watch the guest cart merge into the account.
3. Complete checkout and review the order in **حساب کاربری → سفارش‌ها**.
4. Sign in as the admin and open **مدیریت** in the header.
5. Search `CR-DEMO-1046`, change an order status, approve the pending review and triage a ticket.

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test:api          # Jest unit tests
pnpm test:e2e:api      # Jest + Supertest against the isolated API test database
pnpm test:e2e:web      # Playwright: storefront, auth, admin, headers, WCAG A/AA
pnpm screenshots       # Regenerate docs/screenshots from the running app
```

The suites require PostgreSQL. They derive a dedicated database name by appending `_test` to `DATABASE_URL`, or use `TEST_DATABASE_URL`, and **refuse to run unless the database name ends in `_test`**. Preparation creates the database if needed, applies migrations and reseeds demo data.

Playwright starts its own API (production build) and Next.js dev server on isolated ports (`3101`/`3100`) against that test database. It uses the local Google Chrome channel; CI installs bundled Chromium instead. API and browser tests mutate only the `_test` database.

CI (`.github/workflows/ci.yml`) runs four jobs against a PostgreSQL service:

- **quality** — lint, typecheck, unit tests
- **api-e2e** — migrations, seed and the Supertest suite
- **web-e2e** — Chromium, Playwright and axe; uploads the HTML report
- **build** — production API and web builds, with the API running for storefront prerendering

## Security notes

- Auth cookie is HttpOnly and defaults to SameSite=Lax; use `AUTH_COOKIE_SAME_SITE=none` + HTTPS when web and API are on different sites.
- `tokenVersion` invalidates all existing tokens after logout or password change.
- Cart ownership is keyed to the authenticated user or a validated session header; order and address access always checks ownership.
- OTP login is database-backed: codes are stored only as HMAC-SHA256 digests, generated with `crypto.randomInt`, expire after 120 seconds, allow 5 attempts and 5 sends per 10 minutes, and are consumed atomically. A code is never returned by the API in production; an unconfigured SMS/email channel fails loudly instead.
- Payments are verified against the gateway, never against client-supplied status flags. The API checks order ownership, order status and amount, ignores client-supplied callback URLs, and settles an order at most once in a transaction. The `simulated` gateway is rejected unless `PAYMENT_SIMULATION=true` **and** `NODE_ENV !== production`.
- Order cancellation and stock restoration run in a transaction; invalid status transitions are rejected. A production sweep cancels unpaid orders older than 24 hours and releases their reserved stock, re-checking payment state inside the transaction.
- Review submission requires a matching purchase; publication requires admin approval.
- The API enables Helmet, CORS with credentials, per-route throttling and input sanitization.
- The Next.js app sets `nosniff`, `X-Frame-Options: SAMEORIGIN`, a strict referrer policy, a restrictive permissions policy, HSTS and hides `X-Powered-By`.
- The legacy PHP backend and build artifacts were removed from the repository so there is exactly one backend to audit.

## Performance and accessibility

- Catalog and journal pages are server-rendered per request, so filters, search and pagination work without client-side data fetching and are fully crawlable.
- Static assets (imagery, fonts, JS/CSS) are content-hashed and cached immutably; user-specific data is never cached.
- Product imagery is local WebP served through `next/image` with an immutable cache header.
- Above-the-fold imagery (hero, first catalog row, featured article) is prioritized; the rest is lazy-loaded.
- Dialogs trap focus, close on Escape and restore focus to the trigger.
- Playwright runs axe-core against every primary public page, the auth dialog and the admin dashboard on each CI run. Current result: **zero WCAG 2.0/2.1 A/AA violations**.
- Layout is RTL-first with `lang="fa"` / `dir="rtl"`, visible focus styles, semantic landmarks and labeled controls.

## Deployment

The storefront must run as a **Node.js server**; `output: "export"` is intentionally not used. A clean reference setup:

1. **PostgreSQL** — create a Neon or managed Postgres database.
2. **API** — deploy `apps/api` to Railway or Render:
   - install: `pnpm install --frozen-lockfile`
   - build: `pnpm --filter api build`
   - pre-deploy: `pnpm --filter api prisma:deploy`
   - start: `node apps/api/dist/src/main.js`
   - set `TRUST_PROXY=true`, `NODE_ENV=production`, `NEXT_PUBLIC_SITE_URL`, `JWT_SECRET` (32+ chars), `OTP_SECRET`, and live gateway + SMS/email credentials
3. **Web** — deploy `apps/web` to any Node host (Railway, Render, Fly, a VPS):
   - install: `pnpm install --frozen-lockfile`
   - build: `pnpm build:web`
   - start: `pnpm --filter web start`
   - set `NEXT_PUBLIC_API_URL=/api`, `API_URL` to the private API origin, `API_PROXY_TARGET` to the same origin, and `NEXT_PUBLIC_SITE_URL` to the public storefront origin
4. **CORS + cookies** — with the `/api` rewrite, cookies are first-party and `AUTH_COOKIE_SAME_SITE=lax` is correct. If the browser calls the API on another site, set `CORS_ORIGINS` to the exact storefront origin and `AUTH_COOKIE_SAME_SITE=none` (this forces `Secure`).
5. **Payments** — configure live Zarinpal/Zibal credentials and leave `PAYMENT_SIMULATION` unset or `false`. A production API refuses to mark an order paid when no gateway is configured.
6. **Demo data** — point the API at an empty database, run migrations, then seed once with `SEED_ALLOW_PRODUCTION=true` and a strong `SEED_DEMO_PASSWORD`.

Do not run the seed against a database containing real orders or accounts.

## Design decisions and trade-offs

- **Cookie auth over bearer tokens in local storage** — safer against XSS; cross-site deployment requires the documented cookie settings.
- **SSR over a static export** — catalog and journal search/filter/pagination are URL-driven and server-rendered, so results are shareable, crawlable and correct without JavaScript. The trade-off is that the storefront needs a Node host instead of plain shared hosting.
- **One backend** — the legacy PHP backend was removed; NestJS is the single source of truth for auth, catalog, orders and payments.
- **Server components for catalog content, client components for interaction** — keeps the initial HTML fast without giving up cart/auth UX.
- **Transactional stock** — orders cannot oversell; cancellation restores stock exactly once.
- **Verified reviews with moderation** — mirrors real workshop operations; the demo ships one pending review so the admin queue is visible.
- **Generated local imagery** — product photos are AI-generated WebP assets for the demo, committed locally so the portfolio never depends on third-party image hosts.
- **Real gateways, verified server-side** — Zarinpal and Zibal are integrated; the API verifies every payment with the gateway and never trusts the browser. A development-only simulator exists behind `PAYMENT_SIMULATION` and is impossible in production.
- **Database-backed OTP** — codes survive restarts, work across instances, are hashed at rest and are rate-limited per identifier.
- **In-memory rate limiting** — correct for a single API instance; a Redis-backed throttler is the next step for horizontal scaling.

## Case study

A longer write-up of the problem, decisions and lessons is available in Persian: [`docs/case-study.fa.md`](docs/case-study.fa.md).

## License

MIT © 2026 Rootwood Group. Product imagery is AI-generated for demonstration purposes.
