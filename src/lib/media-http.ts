import { NextResponse } from 'next/server';
import { readMediaFile, mimeFromFilename, isSafeMediaName, decodeUploadedName } from '@/lib/media';

function candidates(rawName: string): string[] {
  const stripped = rawName.replace(/^\/+/, '').split('/').pop() || '';
  const out = [stripped];
  try {
    out.push(decodeURIComponent(stripped));
  } catch {
    /* ignore */
  }
  out.push(decodeUploadedName(stripped));
  return [...new Set(out.filter(Boolean))];
}

export async function mediaGetResponse(rawName: string) {
  for (const name of candidates(rawName)) {
    if (!isSafeMediaName(name)) continue;
    const file = await readMediaFile(name);
    if (!file) continue;
    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        'Content-Type': file.mime || mimeFromFilename(name),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline'
      }
    });
  }

  return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}
