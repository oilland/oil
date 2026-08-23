import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * سرو فایل‌های آپلودی.
 * عکس‌های آپلودشده در پوشهٔ «uploads» (خارج از public) ذخیره می‌شوند و از این
 * مسیر نمایش داده می‌شوند؛ چون Next.js در حالت production، فایل‌هایی که بعد از
 * build به public اضافه شوند را سرو نمی‌کند.
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

  const file = path.join(process.cwd(), 'uploads', name);
  try {
    const buf = await readFile(file);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline'
      }
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
