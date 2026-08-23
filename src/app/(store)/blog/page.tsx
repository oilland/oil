import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { IconFileText } from '@/components/icons';

export const metadata = { title: 'وبلاگ' };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const sp = await searchParams;
  const cat = typeof sp.cat === 'string' ? sp.cat : undefined;

  const [categories, posts] = await Promise.all([
    prisma.blogCategory.findMany({ include: { _count: { select: { posts: true } } } }),
    prisma.blogPost.findMany({
      where: { status: 'published', ...(cat ? { category: { slug: cat } } : {}) },
      orderBy: { publishedAt: 'desc' },
      include: { category: true }
    })
  ]);

  return (
    <div className="container-x section">
      <h1 className="mb-8 text-2xl font-black text-slate-900">وبلاگ روغن‌لند</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit lg:sticky lg:top-32">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="mb-3 text-sm font-bold text-slate-900">دسته‌بندی‌ها</p>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/blog" className={`block rounded-lg px-3 py-2 ${!cat ? 'bg-brand-50 font-bold text-brand-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                  همه مقالات
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/blog?cat=${c.slug}`} className={`flex items-center justify-between rounded-lg px-3 py-2 ${cat === c.slug ? 'bg-brand-50 font-bold text-brand-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {c.name}
                    <span className="text-xs text-slate-400">{new Intl.NumberFormat('fa-IR').format(c._count.posts)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div>
          {posts.length === 0 ? (
            <EmptyState icon={<IconFileText className="h-7 w-7" />} title="مقاله‌ای یافت نشد" />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {posts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
                  <div className="relative h-48 overflow-hidden">
                    <img src={p.coverImage ?? '/images/placeholder.svg'} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                      {p.category && <span className="badge bg-brand-50 text-brand-700">{p.category.name}</span>}
                      {p.publishedAt && <span>{formatDate(p.publishedAt)}</span>}
                    </div>
                    <h2 className="mb-2 line-clamp-2 text-base font-bold leading-7 text-slate-900 group-hover:text-brand-700">{p.title}</h2>
                    {p.excerpt && <p className="line-clamp-3 text-sm leading-6 text-slate-500">{p.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
