import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { compressImage } from '@/lib/image-compress';
import { saveMediaFile } from '@/lib/media';

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'image/avif': 'avif'
};
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(req: NextRequest) {
  // Only signed-in staff may upload
  const session = await getSession();
  if (!hasPermission(session, 'products.create') && !hasPermission(session, 'settings.manage')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'فایل خالی است' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم فایل بیش از ۸ مگابایت است' }, { status: 400 });
    }

    if (!ALLOWED[file.type]) {
      return NextResponse.json({ error: 'فرمت مجاز نیست (JPG, PNG, WebP, SVG, GIF)' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // فشرده‌سازی هوشمند: حجم را تا حد ممکن کم می‌کند بدون افت محسوس کیفیت
    const { data, ext } = await compressImage(buf, file.type);

    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    // ماندگار در PostgreSQL (+ کش دیسک). روی لیارا بدون Disk، فقط دیتابیس
    // جلوی پریدن عکس بعد از دیپلوی/ری‌استارت را می‌گیرد.
    const mime = ALLOWED[file.type] === ext ? file.type : (
      ext === 'jpg' ? 'image/jpeg' :
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      ext === 'avif' ? 'image/avif' :
      ext === 'gif' ? 'image/gif' :
      ext === 'svg' ? 'image/svg+xml' : file.type
    );
    await saveMediaFile(name, data, mime);

    return NextResponse.json({ url: `/uploads/${name}`, name });
  } catch (e) {
    console.error('upload error:', e);
    return NextResponse.json({ error: 'خطا در ذخیره فایل' }, { status: 500 });
  }
}
