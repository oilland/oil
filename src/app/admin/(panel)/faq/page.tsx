import Link from 'next/link';
import { prisma } from '@/lib/db';
import { saveFaq, deleteFaq } from '@/actions/admin-content';
import { Flash } from '@/components/ui';
import { IconEdit, IconTrash } from '@/components/icons';

export const metadata = { title: 'سوالات متداول' };

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ edit?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === 'string' ? sp.edit : null;

  const [items, edit] = await Promise.all([
    prisma.faq.findMany({ orderBy: { sortOrder: 'asc' } }),
    editId ? prisma.faq.findUnique({ where: { id: editId } }) : null
  ]);

  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">سوالات متداول</h1>
      <Flash searchParams={sp} />

      <div className="mb-6 card p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? 'ویرایش سوال' : 'سوال جدید'}</h2>
        <form action={saveFaq} className="grid grid-cols-1 gap-3">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <input name="question" defaultValue={edit?.question} placeholder="سوال *" className={input} required />
          <textarea name="answer" rows={2} defaultValue={edit?.answer ?? ''} placeholder="پاسخ" className="input resize-none" />
          <div className="flex flex-wrap items-center gap-4">
            <input name="sortOrder" type="number" defaultValue={edit?.sortOrder ?? 0} placeholder="ترتیب" className={`${input} w-32`} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="h-4 w-4 accent-brand-700" /> فعال
            </label>
            <button type="submit" className="btn-primary h-10">{edit ? 'ذخیره' : 'افزودن'}</button>
            {edit && <Link href="/admin/faq" className="btn-ghost h-10">انصراف</Link>}
          </div>
        </form>
      </div>

      <div className="space-y-2">
        {items.map((f) => (
          <div key={f.id} className="card flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-bold text-slate-800">{f.question}</p>
              <p className="mt-1 text-sm text-slate-500">{f.answer}</p>
              <span className={`badge mt-1.5 ${f.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{f.isActive ? 'فعال' : 'غیرفعال'}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link href={`/admin/faq?edit=${f.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
              <form action={deleteFaq}><input type="hidden" name="id" value={f.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
