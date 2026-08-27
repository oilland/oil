# روغن‌لند — ادامه کار در چت جدید

این پروژه **OilLand / روغن‌لند** است (`https://github.com/oilland/oil`).  
**هیچ ارتباطی با Versus ندارد.**

به دستیار بگو:

> از CONTINUE.md و بخش «ادامه از اینجا» در HANDOVER.md شروع کن. این پروژه OilLand است و به Versus مربوط نیست. عکس و مطالب پنل را پاک نکن.

---

## قوانین سخت (نقض نشوند)

1. **هرگز** روی دیتابیس لایو `prisma migrate reset` / `db push --force-reset` / `DELETE` روی محصول/بنر/مقاله/MediaFile نزن.
2. **هرگز** `npm run db:seed` روی سرور لیارا نزن اگر سایت از قبل بالاست (seed فقط وقتی جدول خالی است اجرا می‌شود؛ با این حال دست نزن).
3. کد را عوض کن؛ **محتوای پنل در PostgreSQL لیارا می‌ماند** (محصول، بنر، وبلاگ، تنظیمات، سفارش، عکس آپلودی در جدول `MediaFile`).
4. از کاربر **DATABASE_URL / رمز دیتابیس / AUTH_SECRET** نخواه مگر واقعاً ضروری باشد.
5. زیپ لیارا **بدون** `package-lock.json` و بدون `.env` و `node_modules`.
6. آخر هر کار عملی: زیپ بساز + در صورت امکان `npm run push`.

---

## ماندگاری عکس و مطلب

- آپلود پنل → فشرده‌سازی sharp → ذخیره در `uploads/` (کش) **و** جدول `MediaFile` در Postgres.
- سرو از `/uploads/[...path]` : اول دیسک، اگر نبود از DB و برگرداندن به دیسک.
- بعد از هر بوت، فایل‌های DB روی دیسک خالی کانتینر restore می‌شوند.
- سید فقط اگر هیچ user/product/banner/post/media نباشد اجرا می‌شود.
- عکس‌های پیش‌فرض کاتالوگ در `public/images/...` داخل خود کد هستند و با دیپلوی نمی‌پرند.

عکس‌هایی که **قبل از نسخه ۷** فقط روی دیسک موقت بودند و پریده‌اند قابل بازیابی نیستند؛ بعد از این نسخه آپلود جدید نمی‌پرد.

---

## دستور زیپ لیارا

```bash
cd /home/user && rm -f oilland-liara.zip && cd oil && zip -rq /home/user/oilland-liara.zip . \
  -x "node_modules/*" ".next/*" ".git/*" ".env" "*.log" "tsconfig.tsbuildinfo" "package-lock.json"
```

سپس فایل را با `present_file` به کاربر نشان بده.

---

## گیت‌هاب

```bash
npm run push                 # add + commit + push
npm run push -- "پیام"
```

- ریموت پیش‌فرض: `https://github.com/oilland/oil.git`
- هوک: `.githooks/post-commit` (با `npm run hooks` یا `prepare`) بعد از هر کامیت خودکار push می‌کند.
- اگر توکن باشد: `GITHUB_TOKEN=... npm run push`

---

## باگ‌های رفع‌شدهٔ مهم

- بیلد لیارا + `sitemap.xml` بدون دیتابیس: `export const dynamic = 'force-dynamic'`
- `/products?sort=bestseller` کرش Prisma orderBy → آرایه
- پریدن اسلایدر: دیسک موقت لیارا → الان MediaFile
- فوتر: «طراحی و توسعه: seytare team»

---

## بعدی (هنوز نمانده)

- زرین‌پال واقعی (الان card / COD / mock)
- SMS
- Google Search Console + sitemap
- کلید AI برای دستیار سئو (`/admin/seo`)
