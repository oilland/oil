import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reviewSchema } from '@/lib/validators';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const raw = await req.json();
    const parsed = reviewSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر است' }, { status: 400 });
    }
    const data = parsed.data;
    const product = await prisma.product.findUnique({ where: { id: raw.productId } });
    if (!product) return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });

    await prisma.review.create({
      data: {
        productId: product.id,
        userId: session?.sub ?? null,
        name: data.name,
        rating: data.rating,
        title: data.title || null,
        body: data.body,
        status: 'pending'
      }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت دیدگاه' }, { status: 500 });
  }
}
