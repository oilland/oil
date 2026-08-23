import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { formatPrice, formatDate } from '@/lib/format';
import { StatusPill, EmptyState } from '@/components/ui';
import { ORDER_STATUSES } from '@/lib/constants';
import { IconPackage } from '@/components/icons';

export const metadata = { title: 'سفارش‌های من' };

export default async function OrdersPage() {
  const session = await getSession();
  const orders = await prisma.order.findMany({
    where: { userId: session!.sub },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">سفارش‌های من</h1>
      {orders.length === 0 ? (
        <EmptyState icon={<IconPackage className="h-7 w-7" />} title="سفارشی ندارید" message="پس از ثبت اولین سفارش، جزئیات آن اینجا نمایش داده می‌شود.">
          <Link href="/products" className="btn-primary">شروع خرید</Link>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:shadow-card-hover">
              <div>
                <p className="text-sm font-bold text-slate-800" dir="ltr">{o.orderNumber}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(o.createdAt)} · {new Intl.NumberFormat('fa-IR').format(o.items.reduce((s, i) => s + i.quantity, 0))} کالا</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusPill value={o.status} items={ORDER_STATUSES} />
                <span className="text-sm font-extrabold text-slate-900">{formatPrice(o.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
