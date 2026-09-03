import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatPrice, formatShortDate, formatPriceCompact, formatDateTime } from '@/lib/format';
import { StatCard } from '@/components/admin/StatCard';
import { LineChart, HBarChart } from '@/components/admin/Charts';
import { StatusPill } from '@/components/ui';
import { ORDER_STATUSES } from '@/lib/constants';
import { IconWallet, IconInbox, IconUsers, IconPackage, IconAlert, IconClock } from '@/components/icons';

export const metadata = { title: 'داشبورد' };

export default async function AdminDashboard() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    revenueAgg,
    ordersCount,
    customersCount,
    allProducts,
    pendingCount,
    paidOrders30,
    recentOrders,
    topItems
  ] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: 'paid' }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { OR: [{ roleId: null }, { role: { slug: { notIn: ['SUPER_ADMIN', 'ADMIN'] } } }] } }),
    prisma.product.findMany({ where: { deletedAt: null }, select: { id: true, name: true, stock: true, lowStockThreshold: true } }),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.findMany({ where: { paymentStatus: 'paid', createdAt: { gte: thirtyDaysAgo } }, select: { total: true, createdAt: true } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { name: true } } } }),
    prisma.orderItem.groupBy({ by: ['productId'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 })
  ]);

  const lowStock = allProducts.filter((p) => p.stock <= p.lowStockThreshold);

  const topIds = topItems.map((t) => t.productId).filter((x): x is string => x !== null);
  const topProductNames = await prisma.product.findMany({
    where: { id: { in: topIds } },
    select: { id: true, name: true }
  });
  const nameMap = new Map(topProductNames.map((p) => [p.id, p.name]));
  const topBars = topItems
    .filter((t): t is typeof t & { productId: string } => t.productId !== null)
    .map((t) => ({ label: nameMap.get(t.productId) ?? 'محصول', value: t._sum.quantity ?? 0 }));

  // Build last-30-days sales series
  const byDay = new Map<number, number>();
  for (const o of paidOrders30) {
    const d = new Date(o.createdAt);
    d.setHours(0, 0, 0, 0);
    const key = d.getTime();
    byDay.set(key, (byDay.get(key) ?? 0) + o.total);
  }
  const days: { value: number; label: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    d.setHours(0, 0, 0, 0);
    days.push({ value: byDay.get(d.getTime()) ?? 0, label: formatShortDate(d) });
  }
  const chartValues = days.map((d) => d.value);
  const chartLabels = [days[0].label, days[14].label, days[29].label];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-slate-900">داشبورد مدیریت</h1>
        <div className="flex gap-2">
          <Link href="/admin/stats" className="btn-outline">آمار بازدید</Link>
          <Link href="/admin/products/new" className="btn-primary">+ محصول جدید</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<IconWallet className="h-5 w-5" />} label="درآمد کل" value={formatPrice(revenueAgg._sum.total ?? 0)} tone="green" />
        <StatCard icon={<IconInbox className="h-5 w-5" />} label="سفارش‌ها" value={new Intl.NumberFormat('fa-IR').format(ordersCount)} sub={`${new Intl.NumberFormat('fa-IR').format(pendingCount)} در انتظار پرداخت`} tone="accent" />
        <StatCard icon={<IconUsers className="h-5 w-5" />} label="مشتریان" value={new Intl.NumberFormat('fa-IR').format(customersCount)} tone="brand" />
        <StatCard icon={<IconPackage className="h-5 w-5" />} label="محصولات" value={new Intl.NumberFormat('fa-IR').format(allProducts.length)} sub={`${new Intl.NumberFormat('fa-IR').format(lowStock.length)} کم‌موجود`} tone={lowStock.length > 3 ? 'red' : 'brand'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">نمودار فروش (۳۰ روز اخیر)</h2>
            <span className="text-xs text-slate-400">{formatPriceCompact(chartValues.reduce((a, b) => a + b, 0))} تومان</span>
          </div>
          <LineChart data={chartValues} labels={chartLabels} />
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">پرفروش‌ترین محصولات</h2>
          <HBarChart data={topBars} />
        </div>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="text-sm font-extrabold text-slate-900">سفارش‌های اخیر</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-brand-700">مشاهده همه</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4 transition hover:bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-800" dir="ltr">{o.orderNumber}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{o.user?.name ?? o.name} · {formatDateTime(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={o.status} items={ORDER_STATUSES} />
                  <span className="text-sm font-bold">{formatPrice(o.total)}</span>
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && <p className="p-6 text-sm text-slate-400">سفارشی ثبت نشده است.</p>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <IconAlert className="h-4 w-4 text-red-500" />
              هشدار موجودی
            </h2>
            <IconClock className="h-4 w-4 text-slate-300" />
          </div>
          <div className="divide-y divide-slate-100">
            {lowStock.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-2 p-4 text-sm hover:bg-slate-50">
                <span className="truncate font-medium text-slate-700">{p.name}</span>
                <span className={`badge shrink-0 ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.stock === 0 ? 'ناموجود' : `${new Intl.NumberFormat('fa-IR').format(p.stock)} عدد`}
                </span>
              </Link>
            ))}
            {lowStock.length === 0 && <p className="p-6 text-sm text-slate-400">همه محصولات موجودی کافی دارند.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
