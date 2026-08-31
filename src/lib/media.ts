import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { prisma } from './db';

const MIME_FROM_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  avif: 'image/avif'
};

const mem = new Map<string, { data: Buffer; mime: string }>();
let tableReady = false;

export function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
}

export function mimeFromFilename(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return MIME_FROM_EXT[ext] || 'application/octet-stream';
}

/** اگر مرورگر/ویندوز نام فارسی را اشتباه فرستاده، UTF-8 درست را برمی‌گرداند. */
export function decodeUploadedName(name: string): string {
  let s = (name || '').trim();
  if (!s) return s;
  if (/^utf-8''/i.test(s)) {
    try {
      s = decodeURIComponent(s.replace(/^utf-8''/i, ''));
    } catch {
      /* ignore */
    }
  }
  try {
    if (/%[0-9A-Fa-f]{2}/.test(s)) s = decodeURIComponent(s);
  } catch {
    /* ignore */
  }
  // UTF-8 که به‌اشتباه Latin-1 خوانده شده (Ø±ÙˆØºÙ† به‌جای روغن)
  if (/[ØÙÃÆåæ]/u.test(s) && !/[\u0600-\u06FF]/.test(s)) {
    try {
      const utf8 = Buffer.from(s, 'latin1').toString('utf8');
      if (/[\u0600-\u06FF]/.test(utf8) && !utf8.includes('\uFFFD')) s = utf8;
    } catch {
      /* ignore */
    }
  }
  return s;
}

const PERSIAN_OK = /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9._-]+/g;

/** نام اصلی فایل را برای سئو نگه می‌دارد (فاصله → خط تیره، حروف فارسی سالم می‌مانند). */
export function seoFilename(original: string, ext: string): string {
  const base = decodeUploadedName(original).replace(/\\/g, '/').split('/').pop() || '';
  let stem = base.replace(/\.[^.]+$/, '');
  try {
    stem = stem.normalize('NFC');
  } catch {
    /* ignore */
  }
  stem = stem
    .replace(/[\u200c\u200d\u00a0]/g, '')
    .replace(/\s+/g, '-')
    .replace(PERSIAN_OK, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .replace(/[A-Z]/g, (c) => c.toLowerCase());
  if (stem.length > 80) stem = stem.slice(0, 80).replace(/-+$/g, '');
  if (!stem) stem = `image-${Date.now()}`;
  const e = ext.replace(/^\./, '').toLowerCase();
  return `${stem}.${e}`;
}

const SAFE_NAME = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9._-]+$/;

export function isSafeMediaName(name: string): boolean {
  return !!name && name.length <= 120 && !name.includes('..') && !name.includes('/') && SAFE_NAME.test(name);
}

function toBuf(b64: unknown): Buffer {
  if (Buffer.isBuffer(b64)) return b64;
  if (b64 instanceof Uint8Array) return Buffer.from(b64);
  return Buffer.from(String(b64 || ''), 'base64');
}

/**
 * جدول MediaFile را اگر نبود می‌سازد.
 * ستون payload (متن base64) برای PgBouncer/لیارا امن‌تر از BYTEA خام است.
 */
export async function ensureMediaTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MediaFile" (
      "id" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "mime" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "data" BYTEA NOT NULL DEFAULT decode('', 'hex'),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "MediaFile_filename_key" ON "MediaFile"("filename")`
  );
  await prisma.$executeRawUnsafe(`ALTER TABLE "MediaFile" ADD COLUMN IF NOT EXISTS "payload" TEXT`);
  tableReady = true;
}

async function writeDisk(filename: string, data: Buffer) {
  try {
    const dir = getUploadDir();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), data);
  } catch {
    /* دیسک روی لیارا موقتی است — اختیاری */
  }
}

/**
 * اول PostgreSQL (منبع حقیقت)، بعد کش حافظه و دیسک.
 * اگر در دیتابیس ننشیند آپلود شکست می‌خورد.
 */
export async function saveMediaFile(filename: string, data: Buffer, mime: string) {
  await ensureMediaTable();
  const b64 = data.toString('base64');
  const id = randomUUID().replace(/-/g, '');
  await prisma.$executeRaw`
    INSERT INTO "MediaFile" (id, filename, mime, size, data, payload, "createdAt")
    VALUES (
      ${id},
      ${filename},
      ${mime},
      ${data.length},
      decode(${b64}, 'base64'),
      ${b64},
      NOW()
    )
    ON CONFLICT (filename) DO UPDATE SET
      mime = EXCLUDED.mime,
      size = EXCLUDED.size,
      data = EXCLUDED.data,
      payload = EXCLUDED.payload
  `;

  const check = await prisma.$queryRaw<{ b64: string | null }[]>`
    SELECT COALESCE(payload, encode(data, 'base64')) AS b64
    FROM "MediaFile" WHERE filename = ${filename} LIMIT 1
  `;
  const saved = toBuf(check[0]?.b64);
  if (!saved.length) {
    throw new Error('media persist failed: empty row');
  }

  mem.set(filename, { data, mime });
  await writeDisk(filename, data);
}

export async function readMediaFile(filename: string): Promise<{ data: Buffer; mime: string } | null> {
  const hit = mem.get(filename);
  if (hit) return hit;

  try {
    const data = await readFile(path.join(getUploadDir(), filename));
    if (data.length) {
      const mime = mimeFromFilename(filename);
      mem.set(filename, { data, mime });
      return { data, mime };
    }
  } catch {
    /* fall through to DB */
  }

  try {
    await ensureMediaTable();
    const rows = await prisma.$queryRaw<{ b64: string | null; mime: string }[]>`
      SELECT COALESCE(payload, encode(data, 'base64')) AS b64, mime
      FROM "MediaFile" WHERE filename = ${filename} LIMIT 1
    `;
    const row = rows[0];
    if (!row?.b64) return null;
    const data = toBuf(row.b64);
    if (!data.length) return null;
    const mime = row.mime || mimeFromFilename(filename);
    mem.set(filename, { data, mime });
    await writeDisk(filename, data);
    return { data, mime };
  } catch (e) {
    console.error('media db read failed:', e);
    return null;
  }
}

export async function restoreMediaCacheFromDb() {
  try {
    await ensureMediaTable();
    const names = await prisma.$queryRaw<{ filename: string }[]>`
      SELECT filename FROM "MediaFile"
    `;
    if (!names.length) {
      console.log('[media] هیچ فایلی در دیتابیس نیست');
      return;
    }
    let restored = 0;
    for (const { filename } of names) {
      const file = await readMediaFile(filename);
      if (file) restored += 1;
    }
    console.log(`[media] ${restored} فایل از دیتابیس آماده است`);
  } catch (e) {
    console.error('[media] restore skipped:', e instanceof Error ? e.message : e);
  }
}

/** لینک‌های قدیمی /uploads/… را به /api/media/… عوض می‌کند تا از پروکسی استاتیک لیارا رد شوند. */
export async function rewriteUploadUrlsToApi() {
  try {
    const stmts = [
      `UPDATE "ProductImage" SET url = replace(url, '/uploads/', '/api/media/') WHERE url LIKE '%/uploads/%'`,
      `UPDATE "ProductImage" SET "sourceUrl" = replace("sourceUrl", '/uploads/', '/api/media/') WHERE "sourceUrl" LIKE '%/uploads/%'`,
      `UPDATE "Category" SET image = replace(image, '/uploads/', '/api/media/') WHERE image LIKE '%/uploads/%'`,
      `UPDATE "Brand" SET logo = replace(logo, '/uploads/', '/api/media/') WHERE logo LIKE '%/uploads/%'`,
      `UPDATE "Banner" SET image = replace(image, '/uploads/', '/api/media/') WHERE image LIKE '%/uploads/%'`,
      `UPDATE "Banner" SET "mobileImage" = replace("mobileImage", '/uploads/', '/api/media/') WHERE "mobileImage" LIKE '%/uploads/%'`,
      `UPDATE "BlogPost" SET "coverImage" = replace("coverImage", '/uploads/', '/api/media/') WHERE "coverImage" LIKE '%/uploads/%'`,
      `UPDATE "OrderItem" SET image = replace(image, '/uploads/', '/api/media/') WHERE image LIKE '%/uploads/%'`
    ];
    for (const sql of stmts) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch {
        /* جدول ممکن است هنوز نباشد */
      }
    }
    const settings = await prisma.siteSetting.findMany();
    for (const s of settings) {
      if (s.value.includes('/uploads/')) {
        await prisma.siteSetting.update({
          where: { id: s.id },
          data: { value: s.value.split('/uploads/').join('/api/media/') }
        });
      }
    }
  } catch (e) {
    console.error('[media] url rewrite skipped:', e instanceof Error ? e.message : e);
  }
}
