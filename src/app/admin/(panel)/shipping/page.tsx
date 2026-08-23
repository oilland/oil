import Link from 'next/link';
import { prisma } from '@/lib/db';
import { saveShippingMethod, deleteShippingMethod } from '@/actions/admin-content';
import { formatPrice } from '@/lib/format';
import { Flash } from '@/components/ui';
import { IconEdit, IconTrash } from '@/components/icons';

export const metadata = { title: 'روش‌های ارسال' };

export default async function ShippingPage({ searchParams }: { searchParams: Promise<{ edit?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === 'string' ? sp.edit : null;

  const [items, edit] = await Promise.all([
    prisma.shippingMethod.findMany({ orderBy: { sortOrder: 'asc' } }),
    editId ? prisma.shippingMethod.findUnique({ where: { id: editId } }) : null
  ]);

  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">روش‌های ارسال</h1>
      <Flash searchParams={sp} />

      <div className="mb-6 card p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? 'ویرایش روش ارسال' : 'روش ارسال جدید'}</h2>
        <form action={saveShippingMethod} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <input name="name" defaultValue={edit?.name} placeholder="نام (مثلاً پست پیشتاز) *" className={input} required />
          <input name="description" defaultValue={edit?.description ?? ''} placeholder="توضیح" className={input} />
          <input name="estimatedDays" defaultValue={edit?.estimatedDays ?? ''} placeholder="زمان تحویل (مثلاً ۲ تا ۴ روز کاری)" className={input} />
          <input name="price" type="number" defaultValue={edit?.price ?? 0} placeholder="هزینه ارسال (تومان)" className={input} />
          <input name="freeThreshold" type="number" defaultValue={edit?.freeThreshold ?? ''} placeholder="آستانه ارسال رایگان (تومان)" className={input} />
          <input name="sortOrder" type="number" defaultValue={edit?.sortOrder ?? 0} placeholder="ترتیب" className={input} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="h-4 w-4 accent-brand-700" /> فعال
          </label>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary h-10">{edit ? 'ذخیره' : 'افزودن'}</button>
            {edit && <Link href="/admin/shipping" className="btn-ghost h-10">انصراف</Link>}
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
              <th className="p-3 font-medium">نام</th>
              <th className="p-3 font-medium">هزینه</th>
              <th className="p-3 font-medium">ارسال رایگان از</th>
              <th className="p-3 font-medium">زمان تحویل</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-semibold text-slate-800">{m.name}</td>
                <td className="p-3 text-slate-600">{m.price === 0 ? 'رایگان' : formatPrice(m.price)}</td>
                <td className="p-3 text-slate-600">{m.freeThreshold ? formatPrice(m.freeThreshold) : '—'}</td>
                <td className="p-3 text-xs text-slate-500">{m.estimatedDays ?? '—'}</td>
                <td className="p-3">
                  <span className={`badge ${m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{m.isActive ? 'فعال' : 'غیرفعال'}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/shipping?edit=${m.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
                    <form action={deleteShippingMethod}><input type="hidden" name="id" value={m.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
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
