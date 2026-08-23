import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  // Admin area
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return session ? NextResponse.redirect(new URL('/admin', req.url)) : NextResponse.next();
    }
    if (!session) return NextResponse.redirect(new URL('/admin/login', req.url));
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Customer account area
  if (pathname.startsWith('/account')) {
    if (!session) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*']
};
