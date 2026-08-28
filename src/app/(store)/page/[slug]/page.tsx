import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { decodeSlug } from '@/lib/slug';
import { RichText } from '@/components/shop/RichText';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug: decodeSlug(slug) } });
  if (!page) return { title: 'صفحه یافت نشد' };
  return { title: page.seoTitle || page.title, description: page.seoDescription || undefined };
}

export default async function PageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug: decodeSlug(slug) } });
  if (!page) notFound();

  return (
    <div className="container-x section">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-black text-slate-900">{page.title}</h1>
        <div className="card p-8">
          <RichText html={page.content} />
        </div>
      </div>
    </div>
  );
}
