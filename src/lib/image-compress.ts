import sharp from 'sharp';

/**
 * فشرده‌سازی هوشمند تصاویر آپلودی
 * - عکس‌ها را تا نهایتاً ۲۰۴۸ پیکسل کوچک می‌کند (بدون بزرگ‌نمایی)
 * - جهت عکس را بر اساس EXIF اصلاح می‌کند
 * - متادیتای اضافی (EXIF/کامنت) را حذف می‌کند
 * - JPG/WebP/AVIF با کیفیت بهینه بازفشرده می‌شوند (کاهش چشمگیر حجم، افت نامحسوس)
 * - PNG کاملاً بدون افت کیفیت (lossless) فقط بهینه می‌شود
 * - SVG و GIF دست‌نخورده می‌مانند
 */

const MAX_DIM = 2048; // حداکثر ضلع (پیکسل)

function extFromMime(mime: string): string | null {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    default:
      return null;
  }
}

export interface CompressResult {
  data: Buffer;
  ext: string;
  /** آیا تصویر واقعاً فشرده/تغییر کرده است؟ */
  compressed: boolean;
}

export async function compressImage(buf: Buffer, mime: string): Promise<CompressResult> {
  // SVG برداری است؛ رستر کردنش فقط خرابش می‌کند
  if (mime === 'image/svg+xml') {
    return { data: buf, ext: 'svg', compressed: false };
  }

  // GIF انیمیشنی: دست‌نخورده نگه می‌داریم تا انیمیشنش خراب نشود
  if (mime === 'image/gif') {
    return { data: buf, ext: 'gif', compressed: false };
  }

  const ext = extFromMime(mime) ?? 'jpg';

  try {
    let pipeline = sharp(buf)
      .rotate() // اصلاح جهت بر اساس EXIF
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });

    if (mime === 'image/jpeg') {
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    } else if (mime === 'image/png') {
      // PNG بدون افت کیفیت (lossless) — فقط متادیتا و فشرده‌سازی بهتر
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else if (mime === 'image/webp') {
      pipeline = pipeline.webp({ quality: 82 });
    } else if (mime === 'image/avif') {
      pipeline = pipeline.avif({ quality: 55 });
    } else {
      // فرمت ناشناخته: تبدیل به JPEG امن با کیفیت بالا
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
      return { data: await pipeline.toBuffer(), ext: 'jpg', compressed: true };
    }

    const data = await pipeline.toBuffer();

    // محافظ: اگر نتیجه از فایل اصلی بزرگ‌تر شد، فایل اصلی را نگه دار
    if (data.length >= buf.length) {
      return { data: buf, ext, compressed: false };
    }

    return { data, ext, compressed: true };
  } catch {
    // اگر sharp نتوانست (فایل خراب/ناسازگار) → فایل اصلی را همان‌طور ذخیره کن
    return { data: buf, ext, compressed: false };
  }
}
