# روغن‌لند — پرونده چت بعد

پروژه: **OilLand / روغن‌لند**  
ریپو: https://github.com/oilland/oil (شاخه `main`)  
سایت: لیارا · `oilland.shop`  
آخرین کامیت: `64fa0f8` — رفع خطای صفحه آمار بازدید

---

## تو چت جدید چه کار کنی؟

1. همین فایل `CONTINUE.md` را ضمیمه کن.
2. این متن را بفرست:

```
از CONTINUE.md شروع کن. پروژه OilLand / روغن‌لند است.
ریپو https://github.com/oilland/oil
عکس و مطالب پنل را پاک نکن. رمز دیتابیس و توکن نخواه.
آخر کار npm run ship و محیط CMD را بالا بیاور (node scripts/github-oneclick.js روی 0.0.0.0:3847 با اسم CMD).
هرگز prepare در package.json نگذار.
```

3. دستیار اول CMD را استارت کند. تو فقط روی **CMD** کلیک می‌کنی.

### توکن گیت‌هاب

توکن داخل گیت‌هاب/چت ذخیره نمی‌شود. اگر چت جدید محیط خالی باشد، **یک‌بار** همان توکن را داخل صفحه CMD بچسبان — نه داخل چت. بعدش خودکار است.

---

## آپدیت گیت‌هاب (یادت نرود)

آخر **هر** خروجی دستیار این را بزند:

```bash
npm run ship
```

یعنی: زیپ لیارا (`/home/user/oilland-liara.zip` بدون package-lock) + کامیت + پوش به `https://github.com/oilland/oil`.

زیپ را با present_file نشان بدهد.

اگر پوش خطا داد: `node scripts/github-oneclick.js` (CMD روی `0.0.0.0:3847`).  
`git push -u` با URL توکن‌دار نزن (توکن می‌رود توی remote).

**ممنوع:** `"prepare"` در package.json.

---

## قوانین دیتا

- هیچ migrate reset / seed روی لایو
- عکس آپلودی در جدول `MediaFile` (Postgres) — دیسک لیارا پاک می‌شود
- عکس‌ها از `/api/media/نام-فایل` سرو می‌شوند (نام اصلی + فارسی حفظ شود)
- سید فقط اگر دیتابیس خالی باشد
- اگر تغییری `/uploads` لایو را پاک می‌کند، قبلش بگو

---

## وضعیت

| مورد | |
|---|---|
| فروشگاه Next 15 + Prisma + Postgres | لایو لیارا |
| Search Console | وریفای شد؛ صفحه اصلی ایندکس |
| تگ google-site-verification | در layout |
| سئو: metadataBase دامنه واقعی، OG، sitemap `?cat=` | هست |
| فاصله پاراگراف وبلاگ/توضیح محصول (RichText) | رفع شده |
| عکس در DB + `/api/media` + نام فارسی فایل | هست |
| آمار بازدید `/admin/stats` | هست — خطای سرور رفع شد (`64fa0f8`) |
| فوتر: طراحی و توسعه: seytare team | هست |
| CMD یک‌کلیک گیت‌هاب | هست — توکن در چت نگیر |
| prepare در package.json | نباشد |

مسیر پروژه: `/home/user/oil`

---

## کار بعدی

1. زیپ آمار (`64fa0f8`) اگر روی لیارا نیست درگ کن و صفحه `/admin/stats` را چک کن
2. Search Console: سایت‌مپ `sitemap.xml` اگر Submit نشده
3. زرین‌پال / SMS وقتی خواستند

*پروژه مستقل روغن‌لند.*
