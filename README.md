# روغن‌لند — سکوی فروشگاهی روغن و روانکار خودرو

A premium, production-ready e-commerce platform for an Iranian automotive oil & lubricant store — fully bilingual-UI (Persian/Farsi, RTL), with a storefront and a SaaS-style admin panel.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL-ready · Redis-optional**.

---

## ✨ Feature highlights

**Storefront (فروشگاه)**
- Premium RTL Persian UI with self-hosted **Vazirmatn** font
- Home page with hero banners, categories, featured products, best sellers, offers, vehicle selector, brands, why-us, blog, testimonials (all sections admin-controllable)
- Product catalog with search + dynamic filters (brand, category, price, viscosity, volume, type, availability) and sorting
- Product detail: gallery, structured specifications, vehicle compatibility, reviews, related products, **JSON-LD structured data**
- Vehicle compatibility wizard (برند ← مدل ← سال ← موتور)
- Persistent cart (localStorage) + wishlist, coupon validation, multi-step checkout, mock payment gateway (swap-ready for Zarinpal/IDPay)
- Customer account: dashboard, orders, order detail, profile, password change
- Blog + CMS pages + newsletter

**Admin panel (پنل مدیریت)**
- Dashboard with KPI cards, 30-day sales chart, top products, recent orders, low-stock warnings
- Full product management (create/edit/duplicate-ready/delete, bulk actions, image gallery, dynamic spec editor, SEO)
- Categories (hierarchical + reorder), brands, banners, coupons, orders (status workflow, tracking, notes, refund), customers
- Blog, CMS pages, review moderation, roles & permissions editor, activity log, global settings (branding, SEO, social, shipping threshold, maintenance mode)

**Engineering**
- Clean layered architecture: `app/` (routes) · `components/` (UI) · `lib/` (business logic) · `actions/` (server actions) · `api/` (REST)
- RBAC with permission-based guards; password hashing (bcrypt); JWT sessions (httpOnly cookie, edge middleware)
- SQLite in dev/demo — **one-line switch to PostgreSQL** (see below); Redis caching with in-memory fallback
- Dockerfile (Next standalone) + docker-compose (Postgres + Redis + app)
- Activity/audit logging; soft deletes; indexes; zod validation; minimal dependencies (charts and icons are hand-rolled SVG)

---

## 🚀 Quick start (local dev — PostgreSQL)

```bash
# 1) یک PostgreSQL بالا بیاور و DATABASE_URL را در .env بگذار
#    (نمونه در .env.example)
npm install
npx prisma migrate dev    # ساخت جدول‌ها
npm run db:seed           # وارد کردن ۱۷۶ محصول بهران + محتوای سایت
npm run dev               # http://localhost:3000
```

Demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| Customer | `customer@example.com` | `customer123` |

> `npm run images` regenerates the SVG placeholder assets. `npm run db:studio` opens Prisma Studio.

## 🐳 Deploy & delivery

Everything you need to show the client / go live is documented in **`DEPLOY.md`** (فارسی):

- Zero-setup offline preview (`preview-interactive.html`)
- Docker demo (`docker compose -f docker-compose.demo.yml up -d --build`) — single container + SQLite
- Production stack (`docker compose up -d --build`) — Postgres 16 + Redis 7
- Plain Node on a VPS, Iranian cloud platforms (Liara/ArvanCloud), domain + HTTPS

Redis is optional: when `REDIS_URL` is set the cache layer uses Redis, otherwise it falls back to in-memory caching.

## 📁 Project structure

```
src/
  app/                 # routes (storefront, account, admin, api)
  actions/             # server actions (auth, products, orders, marketing, settings…)
  components/          # UI (shop/, admin/, icons, ui primitives)
  lib/                 # db, jwt/session, permissions, cache, coupons, checkout, format, settings…
  middleware.ts        # route protection (/admin, /account)
prisma/
  schema.prisma        # full normalized schema (40+ entities)
  seed.ts              # demo data
scripts/gen-images.mjs # SVG placeholder generator
Dockerfile · docker-compose.yml · .env.example
```

## 🧭 Roadmap / planned integrations
- Real Iranian payment gateways (Zarinpal / IDPay / Zibal) — architecture is ready in `Payment` model + settings
- Email/SMS providers (SMTP + Kavenegar/Melipayamak) — `Notification` model ready
- 2FA for admins, wishlist/cart server sync for logged-in users, product variants UI, FAQ/testimonial admin UI
