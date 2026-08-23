import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Diagnostic endpoint — shows DB connectivity + env status (password masked).
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL || '';
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    host = '(invalid)';
  }

  let db = 'unknown';
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    db = 'connected';
  } catch (e) {
    db = `error: ${String((e as Error).message).split('\n')[0]}`;
  }

  return NextResponse.json({
    app: 'oil-shop',
    databaseUrlSet: Boolean(url),
    databaseHost: host,
    database: db,
    products: db === 'connected' ? await prisma.product.count() : null
  });
}
