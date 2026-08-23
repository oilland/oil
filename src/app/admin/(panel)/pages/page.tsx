import Link from 'next/link';
import { prisma } from '@/lib/db';
import { savePage } from '@/actions/admin-marketing';
import { Flash } from '@/components/ui';
import { IconEdit, IconExternalLink } from '@/components/icons';

export const metadata = { title: 'صفحات' };

export default async function PagesPage({ searchParams }: { searchParams: Promise<{ edit?: string; isNew?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === 'string' ? sp.edit : null;
  const isNew = sp.isNew === '1';

  const [pages, edit] = await Promise.all([
    prisma.page.findMany({ orderBy: { title: 'asc' } }),
    editId ? prisma.page.findUnique({ where: { id: editId } }) : null
  ]);

  const showForm = Boolean(edit) || isNew;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900">صفحات سایت</h1>
        <Link href="/admin/pages?isNew=1" className="btn-primary">+ صفحه جدید</Link>
      </div>
      <Flash searchParams={sp} />

      {showForm && (
        <div className="mb-6 card p-5">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? `ویرایش «${edit.title}»` : 'صفحه جدید'}</h2>
          <form action={savePage} className="space-y-4">
            {edit && <input type="hidden" name="id" value={edit.id} />}
            <input name="title" defaultValue={edit?.title} placeholder="عنوان صفحه *" className="input" required />
            <textarea name="content" rows={8} defaultValue={edit?.content ?? ''} placeholder="متن صفحه (HTML)" dir="ltr" className="input resize-y font-mono text-xs leading-6" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input name="seoTitle" defaultValue={edit?.seoTitle ?? ''} placeholder="عنوان سئو" className="input" />
              <input name="seoDescription" defaultValue={edit?.seoDescription ?? ''} placeholder="توضیحات متا" className="input" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="btn-primary">{edit ? 'ذخیره' : 'ایجاد'}</button>
              <Link href="/admin/pages" className="btn-ghost">انصراف</Link>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
              <th className="p-3 font-medium">عنوان</th>
              <th className="p-3 font-medium">آدرس</th>
              <th className="p-3 font-medium">نوع</th>
              <th className="p-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-semibold text-slate-800">{p.title}</td>
                <td className="p-3 text-xs text-slate-400" dir="ltr">/page/{p.slug}</td>
                <td className="p-3">
                  <span className="badge bg-slate-100 text-slate-600">{p.isSystem ? 'سیستمی' : 'سفارشی'}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/pages?edit=${p.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
                    <Link href={`/page/${p.slug}`} target="_blank" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="مشاهده"><IconExternalLink className="h-4 w-4" /></Link>
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
