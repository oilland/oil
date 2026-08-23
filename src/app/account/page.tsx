import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { formatPrice, formatDate } from '@/lib/format';
import { StatusPill } from '@/components/ui';
import { ORDER_STATUSES } from '@/lib/constants';

export const metadata = { title: 'داشبورد حساب' };

export default async function AccountDashboard() {
  const session = await getSession();
  const [orders, totals] = await Promise.all([
    prisma.order.findMany({ where: { userId: session!.sub }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.order.aggregate({
      where: { userId: session!.sub, status: { in: ['paid', 'processing', 'packed', 'shipped', 'delivered'] } },
      _sum: { total: true },
      _count: true
    })
  ]);

  const stats = [
    { label: 'کل سفارش‌ها', value: new Intl.NumberFormat('fa-IR').format(totals._count) },
    { label: 'مجموع خرید', value: formatPrice(totals._sum.total ?? 0) },
    { label: 'سفارش در حال پردازش', value: new Intl.NumberFormat('fa-IR').format(orders.filter((o) => ['pending', 'paid', 'processing', 'packed', 'shipped'].includes(o.status)).length) }
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">داشبورد حساب کاربری</h1>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-lg font-black text-brand-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-base font-extrabold text-slate-900">سفارش‌های اخیر</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-brand-700 hover:text-brand-900">مشاهده همه</Link>
        </div>
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">هنوز سفارشی ثبت نکرده‌اید.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((o) => (
              <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4 transition hover:bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-800" dir="ltr">{o.orderNumber}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={o.status} items={ORDER_STATUSES} />
                  <span className="text-sm font-bold text-slate-800">{formatPrice(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
