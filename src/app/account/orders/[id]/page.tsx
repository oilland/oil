import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { formatPrice, formatDateTime } from '@/lib/format';
import { StatusPill } from '@/components/ui';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/constants';
import { IconTruck } from '@/components/icons';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const order = await prisma.order.findFirst({
    where: { id, userId: session!.sub },
    include: { items: true, shippingMethod: true }
  });
  if (!order) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900" dir="ltr">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusPill value={order.status} items={ORDER_STATUSES} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-sm font-extrabold text-slate-900">اقلام سفارش</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-4 p-4">
                {it.image && <img src={it.image} alt="" className="h-14 w-14 rounded-lg border border-slate-100 object-cover" />}
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{it.name}</p>
                  <p className="text-xs text-slate-400">{formatPrice(it.price)} × {new Intl.NumberFormat('fa-IR').format(it.quantity)}</p>
                </div>
                <span className="text-sm font-bold text-slate-800">{formatPrice(it.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">جزئیات پرداخت</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">جمع کالاها</dt><dd className="font-semibold">{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-600"><dt>تخفیف</dt><dd>−{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">ارسال</dt><dd className="font-semibold">{order.shippingCost === 0 ? 'رایگان' : formatPrice(order.shippingCost)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-3"><dt className="font-bold">مبلغ کل</dt><dd className="font-black text-brand-800">{formatPrice(order.total)}</dd></div>
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
              <span className="text-slate-500">وضعیت پرداخت</span>
              <StatusPill value={order.paymentStatus} items={PAYMENT_STATUSES} />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <IconTruck className="h-4 w-4 text-brand-600" />
              اطلاعات ارسال
            </h2>
            <dl className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><dt className="text-slate-500">گیرنده</dt><dd className="font-semibold">{order.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">روش ارسال</dt><dd className="font-semibold">{order.shippingMethod?.name ?? '—'}</dd></div>
              {order.trackingCode && <div className="flex justify-between"><dt className="text-slate-500">کد رهگیری</dt><dd className="font-semibold" dir="ltr">{order.trackingCode}</dd></div>}
            </dl>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-6 text-slate-500">
              {order.province}، {order.city} — {order.address}
            </p>
          </div>
        </div>
      </div>

      <Link href="/account/orders" className="btn-ghost mt-6 !px-0 text-brand-700">← بازگشت به سفارش‌ها</Link>
    </div>
  );
}
