import { prisma } from '@/lib/db';
import { toggleCustomer } from '@/actions/admin-other';
import { formatPrice, formatDate } from '@/lib/format';
import { Flash } from '@/components/ui';
import { IconSearch } from '@/components/icons';

export const metadata = { title: 'مشتریان' };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';

  const users = await prisma.user.findMany({
    where: {
      OR: [{ roleId: null }, { role: { slug: { notIn: ['SUPER_ADMIN', 'ADMIN'] } } }],
      ...(q ? { AND: [{ OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] }] } : {})
    },
    include: { orders: { select: { total: true, paymentStatus: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">مشتریان</h1>
      <Flash searchParams={sp} />

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <form action="/admin/customers" className="relative max-w-sm">
            <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="جستجوی نام، ایمیل یا موبایل…" className="input h-10 pr-9" />
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
                <th className="p-3 font-medium">مشتری</th>
                <th className="p-3 font-medium">تاریخ عضویت</th>
                <th className="p-3 font-medium">سفارش‌ها</th>
                <th className="p-3 font-medium">مجموع خرید</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => {
                const spent = u.orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{u.name.slice(0, 1)}</span>
                        <div>
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400" dir="ltr">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="p-3 text-slate-600">{new Intl.NumberFormat('fa-IR').format(u.orders.length)}</td>
                    <td className="p-3 font-bold text-slate-800">{formatPrice(spent)}</td>
                    <td className="p-3">
                      <span className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'فعال' : 'غیرفعال'}</span>
                    </td>
                    <td className="p-3">
                      <form action={toggleCustomer}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn-outline h-8 !py-1 text-xs">{u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
