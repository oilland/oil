import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
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

export function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
}

export function mimeFromFilename(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return MIME_FROM_EXT[ext] || 'application/octet-stream';
}

/**
 * ذخیره روی دیسک (کش) + PostgreSQL (منبع حقیقت).
 * اگر دیتابیس ذخیره نشود آپلود شکست می‌خورد — تا روی لیارا فایل یتیم نماند.
 * هیچ‌وقت فایل قبلی را از DB پاک نمی‌کند (فقط upsert همان نام).
 */
export async function saveMediaFile(filename: string, data: Buffer, mime: string) {
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), data);

  const bytes = new Uint8Array(data);
  await prisma.mediaFile.upsert({
    where: { filename },
    create: { filename, mime, size: data.length, data: bytes },
    update: { mime, size: data.length, data: bytes }
  });
}

/** اول دیسک، اگر نبود از دیتابیس (و بازگردانی به دیسک برای درخواست‌های بعدی) */
export async function readMediaFile(filename: string): Promise<{ data: Buffer; mime: string } | null> {
  const diskPath = path.join(getUploadDir(), filename);
  try {
    const data = await readFile(diskPath);
    return { data, mime: mimeFromFilename(filename) };
  } catch {
    /* fall through */
  }

  try {
    const row = await prisma.mediaFile.findUnique({ where: { filename } });
    if (!row) return null;
    const data = Buffer.from(row.data);
    try {
      await mkdir(getUploadDir(), { recursive: true });
      await writeFile(diskPath, data);
    } catch {
      /* کش دیسک اختیاری است */
    }
    return { data, mime: row.mime || mimeFromFilename(filename) };
  } catch (e) {
    console.error('media db read failed:', e);
    return null;
  }
}

/**
 * بعد از هر دیپلوی، فایل‌های موجود در DB را روی دیسک خالی کانتینر برمی‌گرداند.
 * هیچ ردیفی حذف/بازنویسی در دیتابیس نمی‌شود.
 */
export async function restoreMediaCacheFromDb() {
  try {
    const names = await prisma.mediaFile.findMany({ select: { filename: true } });
    if (!names.length) return;
    const dir = getUploadDir();
    await mkdir(dir, { recursive: true });
    let restored = 0;
    for (const { filename } of names) {
      const diskPath = path.join(dir, filename);
      try {
        await access(diskPath);
        continue;
      } catch {
        /* missing on disk */
      }
      const row = await prisma.mediaFile.findUnique({ where: { filename } });
      if (!row) continue;
      await writeFile(diskPath, Buffer.from(row.data));
      restored += 1;
    }
    if (restored > 0) console.log(`[media] ${restored} فایل از دیتابیس به دیسک برگشت`);
  } catch (e) {
    console.error('[media] restore skipped:', e instanceof Error ? e.message : e);
  }
}
