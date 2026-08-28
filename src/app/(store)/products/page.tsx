import type { Metadata } from 'next';
import { queryProducts, getFilterOptions } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { ProductCard } from '@/components/shop/ProductCard';
import { Filters } from '@/components/shop/Filters';
import { FilterDrawer } from '@/components/shop/FilterDrawer';
import { EmptyState, Pagination } from '@/components/ui';
import { IconSearch, IconBox } from '@/components/icons';

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  return {
    title: q ? `جستجو: ${q}` : 'محصولات',
    description: q
      ? `نتایج جستجو برای ${q} در فروشگاه سرزمین روغن`
      : 'خرید روغن موتور، گیربکس و روانکار از فروشگاه سرزمین روغن',
    alternates: { canonical: '/products' }
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === 'string' ? sp[k] : undefined);

  const params = {
    q: get('q'),
    cat: get('cat'),
    brand: get('brand'),
    offer: get('offer'),
    min: get('min'),
    max: get('max'),
    viscosity: get('viscosity'),
    volume: get('volume'),
    type: get('type'),
    inStock: get('inStock'),
    sort: get('sort'),
    page: get('page')
  };

  // vehicle selector sends vehicle ids under vb/vm/vy/ve keys.
  const vehicleFilter: Record<string, string> = {};
  if (get('vb')) vehicleFilter.vehicleBrand = get('vb')!;
  if (get('vm')) vehicleFilter.vehicleModel = get('vm')!;
  if (get('vy')) vehicleFilter.vehicleYear = get('vy')!;
  if (get('ve')) vehicleFilter.vehicleEngine = get('ve')!;

  const [result, options, settings] = await Promise.all([
    queryProducts({
      q: params.q,
      cat: params.cat,
      brand: params.brand,
      offer: params.offer,
      min: params.min,
      max: params.max,
      viscosity: params.viscosity,
      volume: params.volume,
      type: params.type,
      inStock: params.inStock,
      sort: params.sort,
      page: params.page,
      ...vehicleFilter
    }),
    getFilterOptions(),
    getSettings()
  ]);

  const current: Record<string, string> = {};
  (['q', 'cat', 'brand', 'offer', 'min', 'max', 'viscosity', 'volume', 'type', 'inStock', 'sort', 'vb', 'vm', 'vy', 've'] as const).forEach(
    (k) => {
      const v = get(k);
      if (v) current[k] = v;
    }
  );

  const baseUrl =
    '/products?' +
    Object.entries(current)
      .filter(([k]) => k !== 'page')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

  const hasVehicleFilter = Boolean(vehicleFilter.vehicleBrand || vehicleFilter.vehicleModel || vehicleFilter.vehicleEngine || vehicleFilter.vehicleYear);

  return (
    <div className="container-x section">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 md:text-2xl">
            {params.q ? `نتایج جستجو برای «${params.q}»` : hasVehicleFilter ? 'محصولات سازگار با خودروی شما' : 'همه محصولات'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Intl.NumberFormat('fa-IR').format(result.total)} محصول یافت شد
          </p>
        </div>
        <form action="/products" method="get" className="flex items-center gap-2">
          {Object.entries(current).filter(([k]) => k !== 'sort' && k !== 'page').map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <select name="sort" defaultValue={params.sort ?? ''} className="input h-10 w-44 rounded-lg bg-white text-sm">
            <option value="">مرتب‌سازی: جدیدترین</option>
            <option value="price-asc">ارزان‌ترین</option>
            <option value="price-desc">گران‌ترین</option>
            <option value="rating">بالاترین امتیاز</option>
            <option value="bestseller">پرفروش‌ترین</option>
          </select>
          <button type="submit" className="btn-outline h-10">مرتب کن</button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <FilterDrawer>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <Filters options={options} current={current} />
          </div>
        </FilterDrawer>

        <div>
          {result.items.length === 0 ? (
            <EmptyState
              icon={<IconBox className="h-7 w-7" />}
              title="محصولی یافت نشد"
              message="فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {result.items.map((p) => (
                <ProductCard key={p.id} product={p} currencyLabel={settings.currencyLabel} />
              ))}
            </div>
          )}
          <Pagination page={result.page} totalPages={result.totalPages} baseUrl={baseUrl} />
        </div>
      </div>
    </div>
  );
}
