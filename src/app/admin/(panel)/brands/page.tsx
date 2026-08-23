import Link from 'next/link';
import { prisma } from '@/lib/db';
import { saveBrand, deleteBrand } from '@/actions/admin-catalog';
import { Flash } from '@/components/ui';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { IconEdit, IconTrash } from '@/components/icons';

export const metadata = { title: 'برندها' };

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ edit?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === 'string' ? sp.edit : null;

  const [brands, edit] = await Promise.all([
    prisma.brand.findMany({ where: { deletedAt: null }, include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } }),
    editId ? prisma.brand.findUnique({ where: { id: editId } }) : null
  ]);

  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">برندها</h1>
      <Flash searchParams={sp} />

      <div className="mb-6 card p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? 'ویرایش برند' : 'برند جدید'}</h2>
        <form action={saveBrand} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <input name="name" defaultValue={edit?.name} placeholder="نام برند *" className={input} required />
          <div className="lg:col-span-2">
            <label className="label">لوگوی برند</label>
            <ImageUploader name="logo" defaultValue={edit?.logo ?? ''} label="لوگو" />
          </div>
          <input name="description" defaultValue={edit?.description ?? ''} placeholder="توضیح کوتاه" className={input} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="h-4 w-4 accent-brand-700" />
            فعال
          </label>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary h-10">{edit ? 'ذخیره' : 'افزودن'}</button>
            {edit && <Link href="/admin/brands" className="btn-ghost h-10">انصراف</Link>}
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
              <th className="p-3 font-medium">برند</th>
              <th className="p-3 font-medium">شناسه</th>
              <th className="p-3 font-medium">محصولات</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/60">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {b.logo ? <img src={b.logo} alt="" className="h-9 w-16 rounded-lg border border-slate-100 object-cover" /> : <span className="flex h-9 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{b.name.slice(0, 2)}</span>}
                    <span className="font-semibold text-slate-800">{b.name}</span>
                  </div>
                </td>
                <td className="p-3 text-xs text-slate-400" dir="ltr">{b.slug}</td>
                <td className="p-3 text-slate-600">{new Intl.NumberFormat('fa-IR').format(b._count.products)}</td>
                <td className="p-3">
                  <span className={`badge ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{b.isActive ? 'فعال' : 'غیرفعال'}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/brands?edit=${b.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
                    <form action={deleteBrand}><input type="hidden" name="id" value={b.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
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
