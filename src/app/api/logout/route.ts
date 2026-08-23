import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/jwt';

export async function POST() {
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.redirect(new URL('/admin/login', process.env.APP_URL ?? 'http://localhost:3000'));
}
