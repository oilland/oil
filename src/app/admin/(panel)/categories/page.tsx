import Link from 'next/link';
import { prisma } from '@/lib/db';
import { saveCategory, deleteCategory, moveCategory } from '@/actions/admin-catalog';
import { Flash } from '@/components/ui';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { IconEdit, IconTrash, IconChevronUp, IconChevronDown } from '@/components/icons';

export const metadata = { title: 'دسته‌بندی‌ها' };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === 'string' ? sp.edit : null;

  const [categories, edit] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { products: true, children: true } } },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }]
    }),
    editId ? prisma.category.findUnique({ where: { id: editId } }) : null
  ]);

  const top = categories.filter((c) => !c.parentId);
  const topOptions = top;

  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">دسته‌بندی‌ها</h1>
      <Flash searchParams={sp} />

      <div className="mb-6 card p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</h2>
        <form action={saveCategory} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <input name="name" defaultValue={edit?.name} placeholder="نام دسته‌بندی *" className={input} required />
          <select name="parentId" defaultValue={edit?.parentId ?? ''} className={input}>
            <option value="">— بدون والد —</option>
            {topOptions.filter((t) => t.id !== edit?.id).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input name="description" defaultValue={edit?.description ?? ''} placeholder="توضیح (اختیاری)" className={input} />
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="label">تصویر دسته‌بندی</label>
            <ImageUploader name="image" defaultValue={edit?.image ?? ''} label="تصویر" />
          </div>
          <input name="sortOrder" type="number" defaultValue={edit?.sortOrder ?? 0} placeholder="ترتیب" className={input} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="h-4 w-4 accent-brand-700" />
            فعال
          </label>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary h-10">{edit ? 'ذخیره تغییرات' : 'افزودن'}</button>
            {edit && <Link href="/admin/categories" className="btn-ghost h-10">انصراف</Link>}
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
              <th className="p-3 font-medium">نام</th>
              <th className="p-3 font-medium">شناسه (slug)</th>
              <th className="p-3 font-medium">محصولات</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {top.map((c) => (
              <Rows key={c.id} cat={c} childrenCats={categories.filter((x) => x.parentId === c.id)} />
            ))}
          </tbody>
        </table>
        {categories.length === 0 && <p className="p-8 text-center text-sm text-slate-400">دسته‌بندی‌ای وجود ندارد.</p>}
      </div>
    </div>
  );

  function Rows({ cat, childrenCats, depth = 0 }: { cat: (typeof categories)[number]; childrenCats: (typeof categories)[number][]; depth?: number }) {
    return (
      <>
        <tr className="hover:bg-slate-50/60">
          <td className="p-3">
            <span className="font-semibold text-slate-800" style={{ paddingRight: depth * 22 }}>{cat.name}</span>
          </td>
          <td className="p-3 text-xs text-slate-400" dir="ltr">{cat.slug}</td>
          <td className="p-3 text-slate-600">{new Intl.NumberFormat('fa-IR').format(cat._count.products)}</td>
          <td className="p-3">
            <span className={`badge ${cat.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{cat.isActive ? 'فعال' : 'غیرفعال'}</span>
          </td>
          <td className="p-3">
            <div className="flex items-center gap-1">
              <form action={moveCategory}><input type="hidden" name="id" value={cat.id} /><input type="hidden" name="dir" value="1" /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="بالا"><IconChevronUp className="h-4 w-4" /></button></form>
              <form action={moveCategory}><input type="hidden" name="id" value={cat.id} /><input type="hidden" name="dir" value="-1" /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="پایین"><IconChevronDown className="h-4 w-4" /></button></form>
              <Link href={`/admin/categories?edit=${cat.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
              <form action={deleteCategory}><input type="hidden" name="id" value={cat.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
            </div>
          </td>
        </tr>
        {childrenCats.map((ch) => (
          <Rows key={ch.id} cat={ch} childrenCats={categories.filter((x) => x.parentId === ch.id)} depth={depth + 1} />
        ))}
      </>
    );
  }
}
