import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

// MUST be dynamic: on Liara the database is NOT reachable during `next build`,
// so the sitemap is rendered on-demand at request time (and cached by revalidate headers).
export const dynamic = 'force-dynamic';

const BASE = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://oilland.shop').replace(/\/+$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/vehicle`, changeFrequency: 'monthly', priority: 0.5 }
  ];

  // Guaranteed-safe: if the DB is unreachable for any reason, still return the static URLs.
  try {
    const [products, posts, pages, categories] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null, isPublished: true },
        select: { slug: true, updatedAt: true }
      }),
      prisma.blogPost.findMany({ where: { status: 'published' }, select: { slug: true, updatedAt: true } }),
      prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } })
    ]);

    return [
      ...statics,
      ...categories.map((c) => ({
        url: `${BASE}/products?cat=${encodeURIComponent(c.slug)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6
      })),
      ...products.map((p) => ({
        url: `${BASE}/products/${encodeURIComponent(p.slug)}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8
      })),
      ...posts.map((p) => ({
        url: `${BASE}/blog/${encodeURIComponent(p.slug)}`,
        lastModified: p.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6
      })),
      ...pages.map((p) => ({
        url: `${BASE}/page/${encodeURIComponent(p.slug)}`,
        lastModified: p.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.4
      }))
    ];
  } catch {
    return statics;
  }
}
