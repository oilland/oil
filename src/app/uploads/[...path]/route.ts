import { NextRequest, NextResponse } from 'next/server';
import { readMediaFile } from '@/lib/media';

/**
 * سرو فایل‌های آپلودی.
 * منبع حقیقت: جدول MediaFile در PostgreSQL (روی لیارا ماندگار است).
 * دیسک فقط کش است.
 */
export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  avif: 'image/avif'
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segs } = await params;
  const name = segs.join('/');

  // فقط نام فایل ساده (حروف، عدد، نقطه، خط تیره) — جلوگیری از path traversal
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = (name.split('.').pop() || '').toLowerCase();
  const mime = MIME[ext];
  if (!mime) {
    return new NextResponse('Not found', { status: 404 });
  }

  const file = await readMediaFile(name);
  if (!file) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': file.mime || mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline'
    }
  });
}
