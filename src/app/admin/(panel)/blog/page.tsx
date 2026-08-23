import Link from 'next/link';
import { prisma } from '@/lib/db';
import { deleteBlogPost } from '@/actions/admin-marketing';
import { formatDate } from '@/lib/format';
import { Flash } from '@/components/ui';
import { IconEdit, IconTrash } from '@/components/icons';

export const metadata = { title: 'وبلاگ' };

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true }
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900">مقالات وبلاگ</h1>
        <Link href="/admin/blog/new" className="btn-primary">+ مقاله جدید</Link>
      </div>
      <Flash searchParams={sp} />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
              <th className="p-3 font-medium">عنوان</th>
              <th className="p-3 font-medium">دسته‌بندی</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">تاریخ انتشار</th>
              <th className="p-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-semibold text-slate-800">{p.title}</td>
                <td className="p-3 text-slate-600">{p.category?.name ?? '—'}</td>
                <td className="p-3">
                  <span className={`badge ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                  </span>
                </td>
                <td className="p-3 text-xs text-slate-500">{p.publishedAt ? formatDate(p.publishedAt) : '—'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/blog/${p.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
                    <form action={deleteBlogPost}><input type="hidden" name="id" value={p.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
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
