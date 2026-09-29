# روغن‌لند — پرونده انتقال به چت جدید (مهاجرت به VPS)

> این فایل را در چت جدید **ضمیمه کن** و پیام شروع (پایین) را بفرست.
> این نسخه بعد از هر تغییر مهم به‌روز می‌شود.

## پروژه
- **OilLand / روغن‌لند** — فروشگاه Next.js 15 + Prisma + PostgreSQL
- ریپو (public): `https://github.com/oilland/oil` — شاخه `main`
- سایت قدیمی (لیارا): `https://oilland.shop` — **هنوز روشن است، خاموش نشود** (بکاپ تا اطمینان کامل)
- مسیر پروژه در ورک‌اسپیس چت: `/home/user/oil` (در چت جدید خالی است → `git clone` شود)

## هدف
انتقال کامل سایت از لیارا به VPS ارزان (کاهش هزینه)، **بدون تغییر ظاهر و با پنل ادمین کامل**.

## سرور جدید (مبین‌هاست)
- IP: **`87.107.160.106`** (قبلاً 87.107.129.73 بود، بعد از نصب مجدد OS عوض شد)
- هاست‌نیم: `vm39526-58632.mobinhost.com`
- مشخصات: ۴ گیگ رم / ۲ هسته / ۴۰ گیگ SSD / Ubuntu 22.04 / KVM
- وضعیت: **Active** — سایت رویش بالا آمده و کار می‌کند.
- ورود: `ssh root@87.107.160.106` (بدون VPN؛ سرور ایران است)

## ✅ چه چیزی انجام شده (وضعیت فعلی)
- سرور: Docker + فایروال + swap 2G نصب شد.
- پروژه در `~/oil` روی سرور clone شده.
- `.env` روی سرور ساخته شده (POSTGRES_PASSWORD و AUTH_SECRET تصادفی).
- **دیتا و ۲۶۵ عکس** از لیارا (Postgres 17) با `pg_dump`/restore منتقل شد.
- مشکل `P3005` با `prisma migrate resolve --applied 20260815233118_init` (baseline) حل شد.
- استک با Docker Compose بالاست: `db (postgres:17)`, `redis`, `app`, `caddy`.
- **سایت با IP ایران باز می‌شود و سالم است** (curl داخل سرور: HTTP 200).
- ⚠️ پورت 3000 از بیرون بسته است → دسترسی از **پورت 80 (Caddy)** انجام می‌شود.

## 🔧 اصلاح‌هایی که در ریپوی این ورک‌اسپیس کامیت شده (ولی شاید هنوز روی گیت‌هاب push نشده)
- `docker-compose.vps.yml` — استک VPS + Caddy (نسخهٔ db: **postgres:17-alpine**)
- `Caddyfile` — HTTPS خودکار از روی `SITE_ADDRESS`
- `Dockerfile` — **افزودن `RUN npx prisma generate` در مرحلهٔ runner** (رفع خطای «@prisma/client did not initialize»)
- `docker/entrypoint.sh` — **خودترمیم P3005**: اگر دیتابیس از db push پر باشد، خودکار baseline می‌کند
- `deploy/install.sh` — نصب خودکار (pg_dump داخل داکر با postgres:17؛ حالت غیرتعاملی با env: NONINTERACTIVE/LIARA_DB_URL/DOMAIN)
- `deploy/migrate-from-liara.sh` — انتقال دیتا
- `deploy/oneclick.ps1` + `deploy/oneclick.cmd` — نصب یک‌کلیک از ویندوز (plink)
- `deploy/update.sh` — **به‌روزرسانی سایت با یک دستور** (git reset --hard origin/main + rebuild)
- `RUN-ON-VPS.md` — راهنمای فارسی

> ⚠️ **مهم:** سرور این اصلاح‌ها را با ویرایش دستی (sed) دارد، نه از گیت. تا وقتی این کامیت‌ها روی گیت‌هاب push نشده‌اند، **`deploy/update.sh` را روی سرور نزن** (چون `git reset --hard` اصلاح‌ها را پاک می‌کند). اول push، بعد update.

## ⏳ کار باقی‌مانده (کار بعدی چت جدید)
1. **وصل دامنه + HTTPS** (برای رفع مشکل پنل ادمین):
   - علت مشکل ادمین: کوکی نشست `sameSite:'none'` + `secure:true` است (در `src/lib/session.ts`) → فقط روی **HTTPS** کار می‌کند. روی http لاگین می‌پرد رو صفحهٔ لاگین.
   - رکورد A: `oilland.shop` و `www` → `87.107.160.106`
   - روی سرور در `~/oil/.env`: `APP_URL=https://oilland.shop` و `SITE_ADDRESS=oilland.shop`
   - `cd ~/oil && docker compose -f docker-compose.vps.yml up -d` → Caddy خودکار گواهی می‌گیرد.
   - تست: `https://oilland.shop` → ادمین باید کامل کار کند.
   - گزینهٔ کم‌ریسک: اول با زیردامنهٔ تستی (مثلاً `panel.oilland.shop`).
2. **push اصلاح‌ها به گیت‌هاب** از صفحهٔ CMD با توکن، بعد یک‌بار `bash ~/oil/deploy/update.sh` تا سرور با گیت‌هاب هماهنگ شود.
3. بعد از اطمینان کامل: خاموش‌کردن لیارا (اختیاری، برای کاهش هزینه).

## گردش‌کار دیپلوی از این به بعد
1. تغییر کد در ورک‌اسپیس → `npm run ship` (کامیت) → از CMD با توکن push.
2. روی سرور: `bash ~/oil/deploy/update.sh` (یا از PC: `ssh root@87.107.160.106 "bash ~/oil/deploy/update.sh"`).
   - دیتا/عکس‌ها (در دیتابیس) و `.env` حفظ می‌شوند.

## قوانین
- لیارا را تا اطمینان کامل خاموش نکن.
- رمز/توکن/DATABASE_URL در چت گرفته نشود (فقط روی سرور کاربر).
- 🔒 **رمز دیتابیس لیارا در چت لو رفت** → کاربر باید از پنل لیارا عوضش کند.
- بدون migrate reset/seed روی دیتای لایو. عکس‌ها در `MediaFile` (bytea) + `/api/media` با نام فارسی.
- در `package.json` هرگز `"prepare"` نگذار.
- آخر هر خروجی که چیزی تغییر داد: `npm run ship` + نمایش زیپ با present_file. push فقط از CMD با توکن.
- محیط ورک‌اسپیس شبکهٔ خروجی ندارد؛ نصب/دیپلوی روی خود سرور کاربر انجام می‌شود. برای تست سایت از fetch_page استفاده کن (گاهی به IP ایران وصل نمی‌شود — مرجع، تست داخل سرور با curl است).

---

## پیام شروع برای چت جدید (کپی و بفرست)
```
از CONTINUE-VPS.md شروع کن. پروژه OilLand / روغن‌لند، ریپو https://github.com/oilland/oil (public).
سایت را از لیارا به VPS مبین‌هاست (IP 87.107.160.106، اوبونتو) منتقل کرده‌ایم و روی سرور بالاست و کار می‌کند.
کار باقی‌مانده: وصل دامنه oilland.shop و فعال‌کردن HTTPS (تا پنل ادمین درست شود)، و push اصلاح‌ها به گیت‌هاب و سپس deploy/update.sh.
لیارا را خاموش نکن. رمز/توکن در چت نگیر. از همین‌جا ادامه بده.
```
