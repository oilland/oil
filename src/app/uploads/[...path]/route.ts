import { NextRequest } from 'next/server';
import { mediaGetResponse } from '@/lib/media-http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segs } = await params;
  return mediaGetResponse(segs.join('/'));
}
