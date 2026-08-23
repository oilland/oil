import Link from 'next/link';
import { prisma } from '@/lib/db';
import { saveCoupon, deleteCoupon } from '@/actions/admin-marketing';
import { formatPrice, formatDate } from '@/lib/format';
import { Flash } from '@/components/ui';
import { COUPON_TYPES } from '@/lib/constants';
import { IconEdit, IconTrash } from '@/components/icons';

export const metadata = { title: 'کدهای تخفیف' };

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ edit?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === 'string' ? sp.edit : null;

  const [coupons, edit] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }),
    editId ? prisma.coupon.findUnique({ where: { id: editId } }) : null
  ]);

  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">کدهای تخفیف</h1>
      <Flash searchParams={sp} />

      <div className="mb-6 card p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'}</h2>
        <form action={saveCoupon} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <input name="code" defaultValue={edit?.code} placeholder="کد (مثلاً WELCOME10)" dir="ltr" className={input} required />
          <select name="type" defaultValue={edit?.type ?? 'percent'} className={input}>
            {COUPON_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input name="value" type="number" defaultValue={edit?.value ?? ''} placeholder="مقدار (٪ یا تومان)" className={input} />
          <input name="minOrder" type="number" defaultValue={edit?.minOrder ?? ''} placeholder="حداقل سفارش (تومان)" className={input} />
          <input name="maxDiscount" type="number" defaultValue={edit?.maxDiscount ?? ''} placeholder="سقف تخفیف (تومان)" className={input} />
          <input name="usageLimit" type="number" defaultValue={edit?.usageLimit ?? ''} placeholder="سقف تعداد استفاده" className={input} />
          <div>
            <label className="label">تاریخ شروع</label>
            <input name="startDate" type="date" defaultValue={edit?.startDate ? edit.startDate.toISOString().slice(0, 10) : ''} className={input} dir="ltr" />
          </div>
          <div>
            <label className="label">تاریخ پایان</label>
            <input name="endDate" type="date" defaultValue={edit?.endDate ? edit.endDate.toISOString().slice(0, 10) : ''} className={input} dir="ltr" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="h-4 w-4 accent-brand-700" /> فعال
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="firstOrderOnly" defaultChecked={edit?.firstOrderOnly ?? false} className="h-4 w-4 accent-brand-700" /> فقط سفارش اول
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary h-10">{edit ? 'ذخیره' : 'افزودن'}</button>
            {edit && <Link href="/admin/coupons" className="btn-ghost h-10">انصراف</Link>}
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
              <th className="p-3 font-medium">کد</th>
              <th className="p-3 font-medium">نوع</th>
              <th className="p-3 font-medium">مقدار</th>
              <th className="p-3 font-medium">استفاده</th>
              <th className="p-3 font-medium">انقضا</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-bold text-brand-800" dir="ltr">{c.code}</td>
                <td className="p-3 text-slate-600">{COUPON_TYPES.find((t) => t.value === c.type)?.label ?? c.type}</td>
                <td className="p-3 text-slate-600">{c.type === 'percent' ? `٪${new Intl.NumberFormat('fa-IR').format(c.value)}` : formatPrice(c.value)}</td>
                <td className="p-3 text-slate-600">{new Intl.NumberFormat('fa-IR').format(c.usedCount)}{c.usageLimit ? ` / ${new Intl.NumberFormat('fa-IR').format(c.usageLimit)}` : ''}</td>
                <td className="p-3 text-xs text-slate-500">{c.endDate ? formatDate(c.endDate) : 'بدون انقضا'}</td>
                <td className="p-3">
                  <span className={`badge ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.isActive ? 'فعال' : 'غیرفعال'}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/coupons?edit=${c.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
                    <form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
