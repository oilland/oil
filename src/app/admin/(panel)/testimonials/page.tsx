import Link from 'next/link';
import { prisma } from '@/lib/db';
import { saveTestimonial, deleteTestimonial } from '@/actions/admin-content';
import { Flash, Stars } from '@/components/ui';
import { IconEdit, IconTrash } from '@/components/icons';

export const metadata = { title: 'نظرات مشتریان' };

export default async function TestimonialsPage({ searchParams }: { searchParams: Promise<{ edit?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === 'string' ? sp.edit : null;

  const [items, edit] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } }),
    editId ? prisma.testimonial.findUnique({ where: { id: editId } }) : null
  ]);

  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">نظرات مشتریان</h1>
      <Flash searchParams={sp} />

      <div className="mb-6 card p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? 'ویرایش نظر' : 'نظر جدید'}</h2>
        <form action={saveTestimonial} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <input name="name" defaultValue={edit?.name} placeholder="نام مشتری *" className={input} required />
          <input name="role" defaultValue={edit?.role ?? ''} placeholder="عنوان (مثلاً دارنده پژو ۲۰۶)" className={input} />
          <select name="rating" defaultValue={edit?.rating ?? 5} className={input}>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{new Intl.NumberFormat('fa-IR').format(r)} ستاره</option>
            ))}
          </select>
          <input name="sortOrder" type="number" defaultValue={edit?.sortOrder ?? 0} placeholder="ترتیب" className={input} />
          <textarea name="content" rows={2} defaultValue={edit?.content ?? ''} placeholder="متن نظر *" className="input resize-none sm:col-span-2 lg:col-span-3" required />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="h-4 w-4 accent-brand-700" /> فعال
          </label>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary h-10">{edit ? 'ذخیره' : 'افزودن'}</button>
            {edit && <Link href="/admin/testimonials" className="btn-ghost h-10">انصراف</Link>}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {items.map((t) => (
          <div key={t.id} className="card flex items-center justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{t.name}</span>
                {t.role && <span className="text-xs text-slate-400">{t.role}</span>}
                <Stars rating={t.rating} className="h-3.5 w-3.5" />
                <span className={`badge ${t.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{t.isActive ? 'فعال' : 'غیرفعال'}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{t.content}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link href={`/admin/testimonials?edit=${t.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
              <form action={deleteTestimonial}><input type="hidden" name="id" value={t.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
