import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db-setup';
import { prisma } from '@/lib/db';

// Manual trigger + status. Open in the browser to (re)build tables & seed data.
export async function GET() {
  const result = await setupDatabase();
  let products: number | null = null;
  try {
    products = await prisma.product.count();
  } catch {
    products = null;
  }
  return NextResponse.json({ ...result, products });
}
