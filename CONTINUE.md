# روغن‌لند (OilLand) — پرونده کامل ادامه کار

> **۲۰۲۶/۰۸/۲۷ — نسخه ۸٫۱**  
> ریپو: https://github.com/oilland/oil · شاخه `main`  
> سایت لایو: لیارا · `oilland.shop`

---

## چت جدید

این فایل را ضمیمه کن و بفرست:

```
از CONTINUE.md شروع کن. پروژه OilLand / روغن‌لند است.
ریپو: https://github.com/oilland/oil
عکس و مطالب پنل را پاک نکن. DATABASE_URL و رمز و توکن گیت‌هاب نخواه.
آخر هر کار عملی npm run ship بزن. همزمان npm run github را بالا بیاور (محیط CMD). کاربر روی همان CMD کلیک می‌کند تا گیت‌هاب برود.
هرگز اسکریپت prepare در package.json نگذار.
```

---

## قانون آخر کار (اجباری)

بعد از هر تغییر کدی که خروجی می‌دهی **حتماً** این را اجرا کن:

```bash
npm run ship
```

این دستور **هم** زیپ لیارا می‌سازد (`/home/user/oilland-liara.zip` بدون package-lock) **هم** همان تغییرات را commit+push می‌کند به `oilland/oil`.

- اگر توکن بود: هر دو خودکار انجام می‌شود. زیپ را present کن.
- اگر پوش خطا داد: زیپ را present کن و `npm run github` را روی پورت باز کن تا کاربر یک‌بار دکمه سبز را بزند.

**هرگز `prepare` در package.json نگذار.** لیارا موقع `npm install` فایل هوک را ندارد و بیلد می‌ترکد (`Cannot find module '/app/scripts/install-hooks.js'`). هوک فقط با `npm run hooks` روی سیستم محلی.

---

## قوانین سخت

1. هرگز روی دیتابیس لایو: `migrate reset` / `db push --force-reset` / DELETE روی محصول/بنر/مقاله/`MediaFile`.
2. هرگز `npm run db:seed` روی لیارا اگر سایت بالاست.
3. محتوای پنل در PostgreSQL می‌ماند؛ کد را عوض کن نه دیتا را.
4. DATABASE_URL / رمز / AUTH_SECRET / توکن گیت‌هاب را در چت نخواه و نگیر.
5. زیپ لیارا بدون `package-lock.json` و `.env` و `node_modules` و `.git-push-token`.

---

## وضعیت

| مورد | وضعیت |
|---|---|
| فروشگاه Next.js 15 + Prisma + Postgres، فارسی/RTL | ✅ لایو لیارا |
| کارت‌به‌کارت + COD + mock آنلاین | ✅ زرین‌پال واقعی هنوز نه |
| دستیار سئو `/admin/seo` + sitemap + robots | ✅ |
| بیلد لیارا بدون DB (sitemap داینامیک) | ✅ |
| زیپ بدون package-lock | ✅ |
| کرش پرفروش‌ترین‌ها `sort=bestseller` | ✅ |
| عکس آپلودی در `MediaFile` + sharp | ✅ |
| سید روی دیتابیس زنده اجرا نمی‌شود | ✅ |
| فوتر: طراحی و توسعه: seytare team | ✅ |
| گیت‌هاب یک‌کلیک | ✅ یک‌بار توسط کاربر ثبت شد |
| حذف `prepare` (رفع خطای لیارا ۸٫۱) | ✅ باید با `npm run ship` برود روی گیت‌هاب |
| `npm run ship` = زیپ + گیت‌هاب با هم | ✅ |

---

## عکس

آپلود → sharp → دیسک کش + جدول `MediaFile`. سرو `/uploads/...` اول دیسک بعد DB. بوت فایل‌ها را از DB برمی‌گرداند. عکس پیش‌فرض در `public/images`. عکس‌های قبل از نسخه ۷ که پریده‌اند برنمی‌گردند؛ بعد از دیپلوی ۸٫۱ اسلایدر را اگر خالی بود یک‌بار دوباره آپلود کن.

---

## کار بعدی

1. دیپلوی زیپ ۸٫۱ روی لیارا (بدون prepare)
2. تست `/products?sort=bestseller` و در صورت خالی بودن اسلایدر، آپلود مجدد
3. Google Search Console + sitemap
4. زرین‌پال واقعی
5. SMS
6. کلید AI در `/admin/seo`

---

*پروژه مستقل روغن‌لند (OilLand).*
