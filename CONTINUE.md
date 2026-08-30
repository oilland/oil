# روغن‌لند — پرونده چت بعد

پروژه: **OilLand / روغن‌لند**  
ریپو: https://github.com/oilland/oil (شاخه `main`)  
سایت: لیارا · `oilland.shop`

---

## تو چت جدید چه کار کنی؟

1. این فایل را ضمیمه کن.
2. این متن را بفرست:

```
از CONTINUE.md شروع کن. پروژه OilLand / روغن‌لند است.
ریپو https://github.com/oilland/oil
عکس و مطالب پنل را پاک نکن. رمز دیتابیس و توکن نخواه.
آخر کار npm run ship و محیط CMD را بالا بیاور (node scripts/github-oneclick.js روی 0.0.0.0:3847 با اسم CMD).
هرگز prepare در package.json نگذار.
```

3. دستیار باید اول کار CMD را استارت کند. تو فقط روی **CMD** کلیک می‌کنی.

### توکن در چت جدید

توکن داخل گیت‌هاب ذخیره نمی‌شود. اگر محیط خالی باشد یک‌بار داخل صفحه CMD بچسبان — نه داخل چت.

---

## دستیار آخر هر کار

```bash
npm run ship
```

زیپ: `/home/user/oilland-liara.zip` (بدون package-lock). با present_file نشان بده.

**ممنوع:** `"prepare"` در package.json.

---

## قوانین دیتا

- هیچ migrate reset / seed روی لایو
- عکس آپلودی در جدول MediaFile
- سید فقط اگر دیتابیس خالی باشد

---

## وضعیت

| مورد | |
|---|---|
| فروشگاه Next 15 + Prisma + Postgres | لایو |
| Search Console | وریفای شد؛ صفحه اصلی ایندکس |
| تگ google-site-verification | در layout |
| سئو فنی (metadataBase دامنه واقعی، OG، sitemap `?cat=`) | هست |
| فاصله پاراگراف وبلاگ/توضیح محصول (RichText) | رفع شده |
| عکس آپلودی در PostgreSQL + سرو از `/api/media` | رفع پریدن عکس بعد از ری‌استارت لیارا |
| CMD یک‌کلیک گیت‌هاب | هست — توکن در چت نگیر |
| فوتر seytare team | هست |
| prepare در package.json | نباشد |

مسیر: `/home/user/oil`

---

## کار بعدی

1. زیپ را روی لیارا درگ کن
2. در Search Console سایت‌مپ `sitemap.xml` اگر هنوز Submit نشده
3. زرین‌پال / SMS وقتی خواستند

*پروژه مستقل روغن‌لند.*
