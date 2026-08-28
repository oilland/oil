import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { formatDate, discountPercent, formatPrice } from '@/lib/format';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { Tabs } from '@/components/shop/Tabs';
import { ReviewForm } from '@/components/shop/ReviewForm';
import { ProductActions } from '@/components/shop/ProductActions';
import { ProductCard } from '@/components/shop/ProductCard';
import { Stars, SectionHeading } from '@/components/ui';
import { IconTruck, IconShield, IconRefresh, IconCheck } from '@/components/icons';
import { RichText } from '@/components/shop/RichText';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'محصول یافت نشد' };
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.shortDescription || product.name;
  const image = product.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/products/${product.slug}`,
      images: image ? [{ url: image }] : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const actualPrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const cartItem = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    image: product.images[0]?.url ?? '/images/placeholder.svg',
    stock: product.stock
  };

  const stockState =
    product.stock <= 0
      ? { label: 'ناموجود', cls: 'text-red-600 bg-red-50 border-red-200' }
      : product.stock <= product.lowStockThreshold
        ? { label: `فقط ${formatPrice(product.stock, 'عدد')} باقی مانده`, cls: 'text-amber-700 bg-amber-50 border-amber-200' }
        : { label: 'موجود در انبار', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' };

  const specsByGroup: Record<string, { name: string; value: string }[]> = {};
  for (const s of product.specs) {
    (specsByGroup[s.group] ??= []).push({ name: s.name, value: s.value });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images[0]?.url,
    description: product.shortDescription ?? product.description,
    sku: product.sku,
    url: `https://oilland.shop/products/${encodeURIComponent(product.slug)}`,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      url: `https://oilland.shop/products/${encodeURIComponent(product.slug)}`,
      priceCurrency: 'IRR',
      price: actualPrice * 10, // toman → rial for schema correctness
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    },
    aggregateRating: product.ratingCount
      ? { '@type': 'AggregateRating', ratingValue: product.averageRating, reviewCount: product.ratingCount }
      : undefined
  };

  return (
    <div className="container-x section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-700">خانه</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/products?cat=${product.category.slug}`} className="hover:text-brand-700">{product.category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} />

        <div>
          {product.brand && (
            <Link href={`/products?brand=${product.brand.slug}`} className="mb-2 inline-block text-sm font-bold text-brand-600 hover:text-brand-800">
              {product.brand.name}
            </Link>
          )}
          <h1 className="mb-3 text-xl font-extrabold leading-9 text-slate-900 md:text-2xl">{product.name}</h1>

          <div className="mb-4 flex items-center gap-2">
            <Stars rating={product.averageRating} />
            <span className="text-sm text-slate-500">
              {new Intl.NumberFormat('fa-IR').format(product.ratingCount)} دیدگاه
            </span>
            {product.sku && <span className="ms-2 text-xs text-slate-400">کد: {product.sku}</span>}
          </div>

          <div className="mb-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-brand-800">
                {new Intl.NumberFormat('fa-IR').format(actualPrice)}
                <span className="ms-1.5 text-sm font-medium text-slate-500">{settings.currencyLabel}</span>
              </span>
              {product.salePrice && product.salePrice < product.price && (
                <span className="text-sm text-slate-400 line-through">
                  {new Intl.NumberFormat('fa-IR').format(product.price)}
                </span>
              )}
              {product.salePrice && product.salePrice < product.price && (
                <span className="badge bg-red-100 text-red-700">٪{new Intl.NumberFormat('fa-IR').format(discountPercent(product.price, product.salePrice))} تخفیف</span>
              )}
            </div>
            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${stockState.cls}`}>
              <IconCheck className="h-3.5 w-3.5" />
              {stockState.label}
            </span>
          </div>

          {/* Quick specs */}
          {product.specs.slice(0, 4).length > 0 && (
            <ul className="mb-5 grid grid-cols-2 gap-2 text-sm">
              {product.specs.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">{s.name}</span>
                  <span className="font-semibold text-slate-800">{s.value}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <ProductActions product={cartItem} />

          {/* Shipping / trust */}
          <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2 text-slate-600">
              <IconTruck className="h-5 w-5 text-brand-600" />
              <span>ارسال سریع به سراسر کشور</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <IconShield className="h-5 w-5 text-brand-600" />
              <span>ضمانت اصالت کالا</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <IconRefresh className="h-5 w-5 text-brand-600" />
              <span>۷ روز ضمانت بازگشت</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <Tabs
          tabs={[
            {
              id: 'desc',
              label: 'توضیحات',
              content: (
                <div className="max-w-3xl">
                  <RichText html={product.description || product.shortDescription} />
                </div>
              )
            },
            {
              id: 'specs',
              label: 'مشخصات فنی',
              content: (
                <div className="max-w-3xl space-y-6">
                  {Object.entries(specsByGroup).map(([group, rows]) => (
                    <div key={group}>
                      <h3 className="mb-3 text-sm font-extrabold text-slate-900">{group}</h3>
                      <table className="w-full overflow-hidden rounded-xl border border-slate-200 text-sm">
                        <tbody>
                          {rows.map((r, i) => (
                            <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                              <td className="w-1/2 px-4 py-2.5 text-slate-500">{r.name}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-800">{r.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  {Object.keys(specsByGroup).length === 0 && (
                    <p className="text-sm text-slate-500">مشخصات فنی ثبت نشده است.</p>
                  )}
                </div>
              )
            },
            {
              id: 'compat',
              label: 'سازگاری با خودرو',
              content: (
                <div className="max-w-3xl">
                  {product.compatibilities.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {product.compatibilities.map((c) => (
                        <li key={c.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                          <IconCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="text-slate-700">
                            {c.vehicleBrand?.name} {c.vehicleModel?.name}
                            {c.vehicleYear && <span className="text-slate-400"> · {c.vehicleYear.year}</span>}
                            {c.vehicleEngine && <span className="text-slate-400"> · {c.vehicleEngine.name}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">برای مشاهده خودروهای سازگار از بخش «انتخاب روغن خودرو» استفاده کنید.</p>
                  )}
                </div>
              )
            },
            {
              id: 'reviews',
              label: `دیدگاه‌ها (${new Intl.NumberFormat('fa-IR').format(product.ratingCount)})`,
              content: (
                <div className="max-w-3xl space-y-8">
                  <div className="space-y-4">
                    {product.reviews.map((r) => (
                      <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                              {r.name.slice(0, 1)}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{r.name}</p>
                              <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                            </div>
                          </div>
                          <Stars rating={r.rating} className="h-3.5 w-3.5" />
                        </div>
                        {r.title && <p className="mb-1 text-sm font-bold text-slate-800">{r.title}</p>}
                        <p className="text-sm leading-7 text-slate-600">{r.body}</p>
                      </div>
                    ))}
                    {product.reviews.length === 0 && (
                      <p className="text-sm text-slate-500">هنوز دیدگاهی ثبت نشده است. اولین نفر باشید!</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="mb-4 text-sm font-extrabold text-slate-900">ثبت دیدگاه جدید</h3>
                    <ReviewForm productId={product.id} />
                  </div>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-14">
          <SectionHeading title="محصولات مرتبط" link="/products" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} currencyLabel={settings.currencyLabel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
