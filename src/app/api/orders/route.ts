import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeOrder } from '@/lib/checkout';
import { checkoutSchema } from '@/lib/validators';
import { getSession } from '@/lib/session';
import { logActivity } from '@/lib/activity';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const raw = await req.json();
    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر است' },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const order = await computeOrder({
      items: data.items,
      couponCode: data.couponCode,
      shippingMethodId: data.shippingMethodId,
      userId: session?.sub
    });

    if (order.lines.length === 0) {
      return NextResponse.json({ error: 'سبد خرید خالی است' }, { status: 400 });
    }

    // Stock check
    for (const line of order.lines) {
      if (line.quantity > line.product.stock) {
        return NextResponse.json(
          { error: `موجودی «${line.product.name}» کافی نیست (موجودی: ${line.product.stock})` },
          { status: 400 }
        );
      }
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    const created = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.sub ?? null,
          name: data.name,
          email: data.email || null,
          phone: data.phone,
          province: data.province,
          city: data.city,
          address: data.address,
          postalCode: data.postalCode || null,
          note: data.note || null,
          subtotal: order.subtotal,
          discount: order.discount,
          shippingCost: order.shippingCost,
          total: order.total,
          couponCode: order.couponCode,
          shippingMethodId: data.shippingMethodId,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'pending',
          status: 'pending'
        }
      });

      for (const line of order.lines) {
        await tx.orderItem.create({
          data: {
            orderId: o.id,
            productId: line.product.id,
            name: line.product.name,
            sku: line.product.sku,
            image: line.product.images[0]?.url ?? null,
            price: line.product.salePrice ?? line.product.price,
            quantity: line.quantity,
            total: (line.product.salePrice ?? line.product.price) * line.quantity
          }
        });
        await tx.product.update({
          where: { id: line.product.id },
          data: { stock: { decrement: line.quantity } }
        });
      }

      // Payment record:
      // - card  → کارت به کارت (شماره پیگیری مشتری در referenceCode ذخیره می‌شود)
      // - cod   → پرداخت در محل (بدون درگاه)
      // - online → درگاه آزمایشی (قابل اتصال به زرین‌پال در آینده)
      const gateway = data.paymentMethod === 'card' ? 'card' : data.paymentMethod === 'cod' ? 'cod' : 'mock';
      await tx.payment.create({
        data: {
          orderId: o.id,
          gateway,
          amount: o.total,
          status: 'pending',
          referenceCode: data.cardRef || null,
          metadata: JSON.stringify({
            payerName: data.payerName || null,
            depositAt: data.depositAt || null,
            cardLast4: data.cardLast4 || null
          })
        }
      });

      if (order.couponCode) {
        await tx.coupon.update({
          where: { code: order.couponCode },
          data: { usedCount: { increment: 1 } }
        });
      }

      return o;
    });

    await logActivity({
      userId: session?.sub ?? undefined,
      action: 'ثبت سفارش',
      entity: 'order',
      entityId: created.id,
      newValue: orderNumber
    });

    return NextResponse.json({ orderNumber: created.orderNumber, total: created.total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'خطا در ثبت سفارش' }, { status: 500 });
  }
}
