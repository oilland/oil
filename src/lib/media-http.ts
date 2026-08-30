import { NextResponse } from 'next/server';
import { readMediaFile, mimeFromFilename } from '@/lib/media';

export async function mediaGetResponse(rawName: string) {
  const name = rawName.replace(/^\/+/, '').split('/').pop() || '';
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const file = await readMediaFile(name);
  if (!file) {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': file.mime || mimeFromFilename(name),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline'
    }
  });
}
