// ─────────────────────────────────────────────────────────────────────────────
//  SEO analyzer — audits the whole store and returns scored issues.
//  Every issue is either auto-fixable by the autopilot or a human to-do.
// ─────────────────────────────────────────────────────────────────────────────
import { prisma } from '../db';
import { getSettings } from '../settings';

export type Severity = 'high' | 'medium' | 'low';

export interface SeoIssue {
  id: string;
  area: string; // محصولات | وبلاگ | صفحات | تنظیمات | فنی
  severity: Severity;
  title: string;
  detail: string;
  count?: number;
  fixable: boolean; // autopilot can fix it
}

export interface SeoAudit {
  score: number; // 0..100
  issues: SeoIssue[];
  stats: {
    products: number;
    productsMissingSeo: number;
    productsThinDescription: number;
    productsNoImage: number;
    publishedPosts: number;
    draftPosts: number;
    daysSinceLastPost: number | null;
    postsMissingSeo: number;
    pagesMissingSeo: number;
  };
  generatedAt: string;
}

const WEIGHT: Record<Severity, number> = { high: 15, medium: 7, low: 3 };

export async function runSeoAudit(): Promise<SeoAudit> {
  const settings = await getSettings();
  const issues: SeoIssue[] = [];

  // ── Products ────────────────────────────────────────────────
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isPublished: true },
    select: {
      id: true, name: true, seoTitle: true, seoDescription: true,
      description: true, shortDescription: true, images: { select: { id: true }, take: 1 }
    }
  });
  const missingSeo = products.filter((p) => !p.seoTitle?.trim() || !p.seoDescription?.trim());
  const thinDesc = products.filter((p) => (p.description || '').replace(/<[^>]+>/g, '').length < 200);
  const noImage = products.filter((p) => p.images.length === 0);

  if (missingSeo.length)
    issues.push({
      id: 'products-missing-seo', area: 'محصولات', severity: 'high', fixable: true, count: missingSeo.length,
      title: `${missingSeo.length} محصول بدون عنوان/توضیحات سئو`,
      detail: 'تگ‌های title و meta description مهم‌ترین فاکتور کلیک در نتایج گوگل هستند. دستیار می‌تواند برای همه به‌صورت خودکار بسازد.'
    });
  if (thinDesc.length)
    issues.push({
      id: 'products-thin-description', area: 'محصولات', severity: 'medium', fixable: true, count: thinDesc.length,
      title: `${thinDesc.length} محصول با توضیحات کوتاه (زیر ۲۰۰ کاراکتر)`,
      detail: 'محتوای کم = رتبه پایین. دستیار از روی مشخصات فنی، توضیح استاندارد و کامل‌تری تولید می‌کند.'
    });
  if (noImage.length)
    issues.push({
      id: 'products-no-image', area: 'محصولات', severity: 'medium', fixable: false, count: noImage.length,
      title: `${noImage.length} محصول بدون تصویر`,
      detail: 'تصویر واقعی محصول هم برای سئو (جستجوی تصویر) و هم نرخ تبدیل حیاتی است — نیاز به آپلود دستی.'
    });

  // ── Blog ────────────────────────────────────────────────────
  const [publishedPosts, draftPosts, latestPost] = await Promise.all([
    prisma.blogPost.count({ where: { status: 'published' } }),
    prisma.blogPost.count({ where: { status: 'draft' } }),
    prisma.blogPost.findFirst({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, select: { publishedAt: true } })
  ]);
  const postsMissingSeoList = await prisma.blogPost.findMany({
    where: { OR: [{ seoTitle: null }, { seoTitle: '' }, { seoDescription: null }, { seoDescription: '' }] },
    select: { id: true }
  });
  const daysSinceLastPost = latestPost?.publishedAt
    ? Math.floor((Date.now() - latestPost.publishedAt.getTime()) / 86_400_000)
    : null;

  if (publishedPosts < 8)
    issues.push({
      id: 'blog-few-posts', area: 'وبلاگ', severity: publishedPosts < 4 ? 'high' : 'medium', fixable: true, count: publishedPosts,
      title: `وبلاگ فقط ${publishedPosts} مقاله منتشرشده دارد`,
      detail: 'برای جذب ترافیک از کلمات کلیدی («بهترین روغن موتور»، «روغن هیدرولیک چیست» و…) حداقل ۸ تا ۱۲ مقاله تخصصی لازم است. دستیار مقاله تولید می‌کند.'
    });
  if (daysSinceLastPost !== null && daysSinceLastPost > 14)
    issues.push({
      id: 'blog-stale', area: 'وبلاگ', severity: 'medium', fixable: true, count: daysSinceLastPost,
      title: `آخرین مقاله ${daysSinceLastPost} روز پیش منتشر شده`,
      detail: 'گوگل سایت‌های به‌روز را بالاتر می‌آورد. انتشار منظم (هفته‌ای ۱ تا ۲ مقاله) توصیه می‌شود.'
    });
  if (postsMissingSeoList.length)
    issues.push({
      id: 'posts-missing-seo', area: 'وبلاگ', severity: 'medium', fixable: true, count: postsMissingSeoList.length,
      title: `${postsMissingSeoList.length} مقاله بدون متادیتای سئو`,
      detail: 'دستیار عنوان و توضیحات متا را از محتوای مقاله می‌سازد.'
    });

  // ── CMS pages ───────────────────────────────────────────────
  const pages = await prisma.page.findMany({ select: { id: true, title: true, seoTitle: true, seoDescription: true } });
  const pagesMissingSeo = pages.filter((p) => !p.seoTitle?.trim() || !p.seoDescription?.trim());
  if (pagesMissingSeo.length)
    issues.push({
      id: 'pages-missing-seo', area: 'صفحات', severity: 'low', fixable: true, count: pagesMissingSeo.length,
      title: `${pagesMissingSeo.length} صفحه ثابت بدون متادیتای سئو`,
      detail: 'صفحات «درباره ما»، «تماس» و… هم باید متا داشته باشند.'
    });

  // ── Site settings ───────────────────────────────────────────
  const md = String(settings.metaDescription || '');
  if (md.length < 50 || md.length > 165)
    issues.push({
      id: 'site-meta-length', area: 'تنظیمات', severity: 'medium', fixable: false, count: md.length,
      title: `توضیحات متای سایت ${md.length} کاراکتر است (استاندارد: ۵۰ تا ۱۶۰)`,
      detail: 'از تنظیمات → سئو قابل ویرایش است.'
    });
  if (!settings.instagram && !settings.telegram && !settings.whatsapp)
    issues.push({
      id: 'site-no-social', area: 'تنظیمات', severity: 'low', fixable: false,
      title: 'هیچ شبکه اجتماعی ثبت نشده',
      detail: 'سیگنال‌های اجتماعی و ترافیک ارجاعی برای سئو مفیدند — اینستاگرام/تلگرام را در تنظیمات وارد کنید.'
    });

  // ── Score ───────────────────────────────────────────────────
  let score = 100;
  for (const i of issues) score -= WEIGHT[i.severity];
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    issues,
    stats: {
      products: products.length,
      productsMissingSeo: missingSeo.length,
      productsThinDescription: thinDesc.length,
      productsNoImage: noImage.length,
      publishedPosts,
      draftPosts,
      daysSinceLastPost,
      postsMissingSeo: postsMissingSeoList.length,
      pagesMissingSeo: pagesMissingSeo.length
    },
    generatedAt: new Date().toISOString()
  };
}
