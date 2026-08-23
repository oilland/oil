import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { decodeSlug } from '@/lib/slug';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({ where: { slug: decodeSlug(slug), status: 'published' } });
  if (!post) return { title: 'مقاله یافت نشد' };
  return { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug: decodeSlug(slug), status: 'published' },
    include: { category: true, author: { select: { name: true } } }
  });
  if (!post) notFound();

  const related = await prisma.blogPost.findMany({
    where: { status: 'published', id: { not: post.id }, categoryId: post.categoryId },
    orderBy: { publishedAt: 'desc' },
    take: 3
  });

  return (
    <div className="container-x section">
      <article className="mx-auto max-w-3xl">
        <nav className="mb-4 text-xs text-slate-500">
          <Link href="/blog" className="hover:text-brand-700">وبلاگ</Link>
          {post.category && (
            <>
              <span className="mx-1">/</span>
              <Link href={`/blog?cat=${post.category.slug}`} className="hover:text-brand-700">{post.category.name}</Link>
            </>
          )}
        </nav>
        <h1 className="mb-4 text-2xl font-black leading-10 text-slate-900 md:text-3xl">{post.title}</h1>
        <div className="mb-6 flex items-center gap-3 text-sm text-slate-500">
          {post.author && <span className="font-semibold text-slate-700">{post.author.name}</span>}
          {post.publishedAt && <span>· {formatDate(post.publishedAt)}</span>}
        </div>
        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className="mb-8 w-full rounded-2xl object-cover" />
        )}
        <div
          className="blog-content leading-9 text-slate-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {post.tags && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.split(',').filter(Boolean).map((t) => (
              <span key={t} className="badge bg-slate-100 text-slate-600">{t.trim()}</span>
            ))}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-5 text-lg font-extrabold text-slate-900">مقالات مرتبط</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card p-4 transition hover:shadow-card-hover">
                <h3 className="line-clamp-2 text-sm font-bold text-slate-800 hover:text-brand-700">{p.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
