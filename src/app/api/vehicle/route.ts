import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand');
  const model = req.nextUrl.searchParams.get('model');

  if (!brand) {
    const brands = await prisma.vehicleBrand.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    });
    return NextResponse.json(brands);
  }

  if (!model) {
    const models = await prisma.vehicleModel.findMany({
      where: { brandId: brand },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    });
    return NextResponse.json({ models });
  }

  const [years, engines] = await Promise.all([
    prisma.vehicleYear.findMany({
      where: { modelId: model },
      orderBy: { year: 'desc' },
      select: { id: true, year: true }
    }),
    prisma.vehicleEngine.findMany({
      where: { modelId: model },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    })
  ]);

  return NextResponse.json({ years: years.map((y) => ({ id: y.id, year: y.year })), engines });
}
