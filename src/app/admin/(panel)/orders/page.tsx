import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatPrice, formatDateTime } from '@/lib/format';
import { StatusPill, Flash, EmptyState } from '@/components/ui';
import { ORDER_STATUSES } from '@/lib/constants';
import { IconSearch, IconInbox } from '@/components/icons';

export const metadata = { title: 'سفارش‌ها' };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const status = typeof sp.status === 'string' ? sp.status : '';
  const q = typeof sp.q === 'string' ? sp.q : '';

  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ orderNumber: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } : {})
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true } }, _count: { select: { items: true } } }
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">سفارش‌ها</h1>
      <Flash searchParams={sp} />

      {/* Status filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/orders" className={`badge border ${!status ? 'border-brand-700 bg-brand-800 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>همه</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s.value} href={`/admin/orders?status=${s.value}`} className={`badge border ${status === s.value ? 'border-brand-700 bg-brand-800 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
            {s.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <form action="/admin/orders" className="relative max-w-sm">
            <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="جستجو با شماره سفارش، موبایل یا نام…" className="input h-10 pr-9" />
          </form>
        </div>

        {orders.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<IconInbox className="h-7 w-7" />} title="سفارشی یافت نشد" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
                  <th className="p-3 font-medium">شماره سفارش</th>
                  <th className="p-3 font-medium">مشتری</th>
                  <th className="p-3 font-medium">تاریخ</th>
                  <th className="p-3 font-medium">اقلام</th>
                  <th className="p-3 font-medium">مبلغ</th>
                  <th className="p-3 font-medium">پرداخت</th>
                  <th className="p-3 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-brand-800" dir="ltr">{o.orderNumber}</Link>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{o.user?.name ?? o.name}</p>
                      <p className="text-xs text-slate-400" dir="ltr">{o.phone}</p>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
                    <td className="p-3 text-slate-600">{new Intl.NumberFormat('fa-IR').format(o._count.items)}</td>
                    <td className="p-3 font-bold text-slate-800">{formatPrice(o.total)}</td>
                    <td className="p-3">
                      <span className={`badge ${o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : o.paymentStatus === 'refunded' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                        {o.paymentStatus === 'paid' ? 'پرداخت شده' : o.paymentStatus === 'refunded' ? 'مسترد' : 'در انتظار'}
                      </span>
                      {o.paymentMethod && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {o.paymentMethod === 'card' ? 'کارت به کارت' : o.paymentMethod === 'cod' ? 'در محل' : 'آنلاین'}
                        </p>
                      )}
                    </td>
                    <td className="p-3"><StatusPill value={o.status} items={ORDER_STATUSES} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
