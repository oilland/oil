import Link from 'next/link';
import { prisma } from '@/lib/db';
import { VehicleSelector } from '@/components/shop/VehicleSelector';
import { IconSearch, IconCheck, IconPackage } from '@/components/icons';

export const metadata = { title: 'انتخاب روغن مناسب خودرو' };

export default async function VehiclePage() {
  const brands = await prisma.vehicleBrand.findMany({ orderBy: { name: 'asc' }, take: 12 });

  return (
    <div>
      <section className="bg-gradient-to-l from-brand-950 via-brand-900 to-brand-700 py-14">
        <div className="container-x text-center">
          <h1 className="mb-3 text-2xl font-black text-white md:text-3xl">روغن مناسب خودروی خود را پیدا کنید</h1>
          <p className="mx-auto mb-8 max-w-xl text-sm text-slate-300">
            برند، مدل، سال ساخت و نوع موتور خودرو را انتخاب کنید تا محصولات سازگار با آن نمایش داده شوند.
          </p>
          <div className="mx-auto max-w-4xl rounded-2xl bg-white/95 p-5 shadow-card-hover">
            <VehicleSelector />
          </div>
        </div>
      </section>

      <section className="container-x section">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { icon: IconSearch, title: '۱. انتخاب خودرو', desc: 'برند و مدل خودروی خود را انتخاب کنید' },
            { icon: IconCheck, title: '۲. بررسی سازگاری', desc: 'سیستم محصولات سازگار با موتور خودرو را می‌یابد' },
            { icon: IconPackage, title: '۳. خرید مطمئن', desc: 'محصول مناسب را با ضمانت اصالت خریداری کنید' }
          ].map((s) => (
            <div key={s.title} className="card flex flex-col items-center p-6 text-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-accent-300 shadow-lg shadow-brand-900/20">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mb-1.5 text-base font-bold text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-14">
        <h2 className="mb-5 text-lg font-extrabold text-slate-900">برندهای خودرو</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/products?vb=${b.id}`}
              className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-700 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
