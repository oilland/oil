import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { productCardSelect } from '@/lib/queries';
import { ProductCard } from '@/components/shop/ProductCard';
import { BannerSlider } from '@/components/shop/BannerSlider';
import { VehicleSelector } from '@/components/shop/VehicleSelector';
import { SectionHeading, Stars } from '@/components/ui';
import { IconShield, IconTruck, IconWallet, IconUsers, IconChevronLeft, IconChevronDown } from '@/components/icons';

export default async function HomePage() {
  const [settings, sections, banners, categories, featured, bestsellers, offers, brands, testimonials, posts, faqs] =
    await Promise.all([
      getSettings(),
      prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.banner.findMany({
        where: { isActive: true, section: 'hero' },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.category.findMany({
        where: { isActive: true, deletedAt: null, parentId: null },
        orderBy: { sortOrder: 'asc' },
        include: { children: true }
      }),
      prisma.product.findMany({
        where: { isPublished: true, deletedAt: null, isFeatured: true },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: productCardSelect
      }),
      prisma.product.findMany({
        where: { isPublished: true, deletedAt: null, isBestSeller: true },
        orderBy: { ratingCount: 'desc' },
        take: 4,
        select: productCardSelect
      }),
      prisma.product.findMany({
        where: { isPublished: true, deletedAt: null, salePrice: { not: null, lt: prisma.product.fields.price } },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: productCardSelect
      }),
      prisma.brand.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: 'asc' } }),
      prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.blogPost.findMany({
        where: { status: 'published' },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        include: { category: true }
      }),
      prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })
    ]);

  const sec = (key: string) => sections.find((s) => s.key === key);
  const on = (key: string) => sec(key)?.enabled ?? true;

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: settings.storeName,
    url: 'https://oilland.shop',
    description: settings.metaDescription,
    inLanguage: 'fa-IR'
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      {/* ── Hero ── */}
      {on('hero') && (
        <section className="container-x pt-6">
          <BannerSlider slides={banners} />
        </section>
      )}

      {/* ── Categories ── */}
      {on('categories') && (
        <section className="container-x section">
          <SectionHeading
            title={sec('categories')?.title ?? 'دسته‌بندی محصولات'}
            subtitle={sec('categories')?.subtitle ?? null}
            link="/products"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {categories.slice(0, 7).map((c) => (
              <Link
                key={c.id}
                href={`/products?cat=${c.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-card transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover"
              >
                <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-3xl font-extrabold text-brand-700">{c.name.slice(0, 1)}</span>
                  )}
                </span>
                <span className="text-sm font-bold text-slate-800">{c.name}</span>
                <span className="text-xs text-slate-400">
                  {new Intl.NumberFormat('fa-IR').format(c.children.length)} زیرمجموعه
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {on('featured') && featured.length > 0 && (
        <section className="container-x section pt-0">
          <SectionHeading
            title={sec('featured')?.title ?? 'محصولات ویژه'}
            subtitle={sec('featured')?.subtitle ?? null}
            link="/products"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} currencyLabel={settings.currencyLabel} />
            ))}
          </div>
        </section>
      )}

      {/* ── Vehicle selector ── */}
      {on('vehicle') && (
        <section className="section bg-gradient-to-l from-brand-950 via-brand-900 to-brand-700">
          <div className="container-x">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-extrabold text-white md:text-2xl">
                {sec('vehicle')?.title ?? 'روغن مناسب خودروی خود را پیدا کنید'}
              </h2>
              <p className="mt-2 text-sm text-slate-300">{sec('vehicle')?.subtitle}</p>
            </div>
            <div className="mx-auto max-w-4xl rounded-2xl bg-white/95 p-5 shadow-card-hover">
              <VehicleSelector />
            </div>
          </div>
        </section>
      )}

      {/* ── Best sellers ── */}
      {on('bestsellers') && bestsellers.length > 0 && (
        <section className="container-x section">
          <SectionHeading
            title={sec('bestsellers')?.title ?? 'پرفروش‌ترین‌ها'}
            subtitle={sec('bestsellers')?.subtitle ?? null}
            link="/products?sort=bestseller"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} currencyLabel={settings.currencyLabel} />
            ))}
          </div>
        </section>
      )}

      {/* ── Offers ── */}
      {on('offers') && offers.length > 0 && (
        <section className="section bg-gradient-to-b from-accent-50 via-white to-white">
          <div className="container-x">
            <SectionHeading
              title={sec('offers')?.title ?? 'پیشنهادهای شگفت‌انگیز'}
              subtitle={sec('offers')?.subtitle ?? null}
              link="/products?offer=1"
              linkLabel="همه تخفیف‌ها"
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {offers.map((p) => (
                <ProductCard key={p.id} product={p} currencyLabel={settings.currencyLabel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brands ── */}
      {on('brands') && brands.length > 0 && (
        <section className="container-x section">
          <SectionHeading title={sec('brands')?.title ?? 'برندهای معتبر'} subtitle={sec('brands')?.subtitle ?? null} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/products?brand=${b.slug}`}
                className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 transition hover:shadow-card-hover"
              >
                {b.logo ? (
                  <img src={b.logo} alt={b.name} className="h-12 w-auto object-contain" loading="lazy" />
                ) : (
                  <span className="text-sm font-extrabold text-slate-700">{b.name}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Why us ── */}
      {on('whyus') && (
        <section className="section bg-white">
          <div className="container-x">
            <SectionHeading title={sec('whyus')?.title ?? 'چرا روغن‌لند؟'} subtitle={sec('whyus')?.subtitle ?? null} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: IconShield, title: 'ضمانت اصالت', desc: 'استعلام کد اصالت برای تمامی محصولات' },
                { icon: IconTruck, title: 'ارسال سریع', desc: 'تحویل ۱ تا ۴ روز کاری در سراسر کشور' },
                { icon: IconUsers, title: 'مشاوره تخصصی', desc: 'راهنمایی رایگان برای انتخاب روغن مناسب' },
                { icon: IconWallet, title: 'قیمت منصفانه', desc: 'خرید مستقیم و بدون واسطه' }
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 transition hover:bg-white hover:shadow-card">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-accent-300 shadow-lg shadow-brand-900/20">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mb-1.5 text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog ── */}
      {on('blog') && posts.length > 0 && (
        <section className="container-x section">
          <SectionHeading title={sec('blog')?.title ?? 'آخرین مقالات'} subtitle={sec('blog')?.subtitle ?? null} link="/blog" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
                <div className="relative h-44 overflow-hidden">
                  <img src={p.coverImage ?? '/images/placeholder.svg'} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-5">
                  <span className="badge mb-2 bg-brand-50 text-brand-700">{p.category?.name}</span>
                  <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-6 text-slate-900 group-hover:text-brand-700">{p.title}</h3>
                  {p.excerpt && <p className="line-clamp-2 text-xs leading-5 text-slate-500">{p.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {on('testimonials') && testimonials.length > 0 && (
        <section className="section bg-gradient-to-br from-brand-950 to-brand-900">
          <div className="container-x">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-extrabold text-white md:text-2xl">{sec('testimonials')?.title ?? 'نظرات مشتریان'}</h2>
              <p className="mt-2 text-sm text-slate-400">{sec('testimonials')?.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
                  <Stars rating={t.rating} className="h-4 w-4" />
                  <p className="mt-3 text-sm leading-7 text-slate-300">{t.content}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-white">
                      {t.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      {t.role && <p className="text-xs text-slate-400">{t.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {faqs.length > 0 && (
        <section className="container-x section">
          <SectionHeading title="سوالات متداول" subtitle="پاسخ پرسش‌های پرتکرار مشتریان" />
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((f) => (
              <details key={f.id} className="group rounded-2xl border border-slate-200 bg-white shadow-card transition open:border-brand-300">
                <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-bold text-slate-800">
                  {f.question}
                  <IconChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="border-t border-slate-100 p-4 text-sm leading-7 text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── Mobile view-all ── */}
      <div className="container-x pb-8 text-center">
        <Link href="/products" className="btn-primary inline-flex">
          مشاهده همه محصولات
          <IconChevronLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
