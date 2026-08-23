import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { productCardSelect } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) return NextResponse.json([]);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isPublished: true, deletedAt: null },
    select: productCardSelect
  });
  return NextResponse.json(products);
}
