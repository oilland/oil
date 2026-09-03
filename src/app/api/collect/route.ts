import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { isBot, recordVisit } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOKIE = 'ovid';

export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  if (isBot(ua)) return NextResponse.json({ ok: 1 });

  let body: { path?: string; referrer?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: 0 }, { status: 400 });
  }

  let vid = req.cookies.get(COOKIE)?.value || '';
  if (!/^[a-f0-9]{16,64}$/i.test(vid)) vid = randomBytes(16).toString('hex');

  try {
    await recordVisit({ path: String(body.path || '/'), referrer: String(body.referrer || ''), visitorId: vid });
  } catch (e) {
    console.error('collect:', e);
  }

  const res = NextResponse.json({ ok: 1 });
  res.cookies.set(COOKIE, vid, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production'
  });
  return res;
}
