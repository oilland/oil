import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body.code ?? '');
    const subtotal = Number(body.subtotal ?? 0);
    const result = await validateCoupon(code, subtotal);
    return NextResponse.json(result, { status: result.valid ? 200 : 400 });
  } catch {
    return NextResponse.json({ valid: false, discount: 0, freeShipping: false, message: 'خطا در پردازش درخواست' }, { status: 400 });
  }
}
