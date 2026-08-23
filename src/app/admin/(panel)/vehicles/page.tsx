import Link from 'next/link';
import { prisma } from '@/lib/db';
import {
  saveVehicleBrand,
  deleteVehicleBrand,
  saveVehicleModel,
  deleteVehicleModel,
  deleteVehicleCompatibility
} from '@/actions/admin-vehicles';
import { Flash } from '@/components/ui';
import { VehicleCompatForm } from '@/components/admin/VehicleCompatForm';
import { IconEdit, IconTrash, IconCar } from '@/components/icons';

export const metadata = { title: 'سازگاری خودرو' };

export default async function VehiclesPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; edit?: string; editBrand?: string; brand?: string; flash?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === 'models' || sp.tab === 'compat' ? sp.tab : 'brands';
  const editId = typeof sp.edit === 'string' ? sp.edit : null;
  const editBrandId = typeof sp.editBrand === 'string' ? sp.editBrand : null;
  const brandFilter = typeof sp.brand === 'string' ? sp.brand : '';

  const [brands, models, edit, editBrand, products, compatibilities] = await Promise.all([
    prisma.vehicleBrand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { models: true } } }
    }),
    prisma.vehicleModel.findMany({
      orderBy: { name: 'asc' },
      include: { brand: true, years: { orderBy: { year: 'desc' } }, engines: { orderBy: { name: 'asc' } } }
    }),
    editId ? prisma.vehicleModel.findUnique({ where: { id: editId }, include: { years: true, engines: true } }) : null,
    editBrandId ? prisma.vehicleBrand.findUnique({ where: { id: editBrandId } }) : null,
    prisma.product.findMany({
      where: { deletedAt: null, isPublished: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    }),
    prisma.productCompatibility.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { product: { select: { name: true } }, vehicleBrand: true, vehicleModel: true, vehicleYear: true, vehicleEngine: true }
    })
  ]);

  const filteredModels = brandFilter ? models.filter((m) => m.brandId === brandFilter) : models;
  const input = 'input h-10 rounded-lg';

  const tabBtn = (key: string, label: string) => (
    <Link
      href={`/admin/vehicles?tab=${key}`}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        tab === key ? 'bg-brand-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <h1 className="mb-2 text-xl font-extrabold text-slate-900">سازگاری خودرو</h1>
      <p className="mb-6 text-sm text-slate-500">
        برندها، مدلها، سالها و موتورهای خودرو را مدیریت کنید و محصولات سازگار را مشخص کنید.
      </p>
      <Flash searchParams={sp} />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabBtn('brands', 'برندهای خودرو')}
        {tabBtn('models', 'مدلها (سال و موتور)')}
        {tabBtn('compat', 'سازگاری محصولات')}
      </div>

      {/* ── Brands tab ── */}
      {tab === 'brands' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
          <div className="card h-fit p-5">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">{editBrand ? 'ویرایش برند خودرو' : 'برند خودرو جدید'}</h2>
            <form action={saveVehicleBrand} className="space-y-3">
              {editBrand && <input type="hidden" name="id" value={editBrand.id} />}
              <input name="name" defaultValue={editBrand?.name} placeholder="نام برند (مثلاً تویوتا) *" className={input} required />
              <div className="flex items-center gap-2">
                <button type="submit" className="btn-primary h-10">{editBrand ? 'ذخیره' : 'افزودن'}</button>
                {editBrand && <Link href="/admin/vehicles?tab=brands" className="btn-ghost h-10">انصراف</Link>}
              </div>
            </form>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
                  <th className="p-3 font-medium">برند</th>
                  <th className="p-3 font-medium">شناسه</th>
                  <th className="p-3 font-medium">تعداد مدل</th>
                  <th className="p-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-slate-800">{b.name}</td>
                    <td className="p-3 text-xs text-slate-400" dir="ltr">{b.slug}</td>
                    <td className="p-3 text-slate-600">{new Intl.NumberFormat('fa-IR').format(b._count.models)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/vehicles?tab=models&brand=${b.id}`} className="btn-outline h-8 !py-1 text-xs">مدلها</Link>
                        <Link href={`/admin/vehicles?tab=brands&editBrand=${b.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
                        <form action={deleteVehicleBrand}><input type="hidden" name="id" value={b.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {brands.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                <IconCar className="h-8 w-8" />
                <p className="text-sm">برندی ثبت نشده است</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Models tab ── */}
      {tab === 'models' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
          <div className="card h-fit p-5">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? 'ویرایش مدل' : 'مدل جدید'}</h2>
            <form action={saveVehicleModel} className="space-y-3">
              {edit && <input type="hidden" name="id" value={edit.id} />}
              <div>
                <label className="label">برند *</label>
                <select name="brandId" defaultValue={edit?.brandId ?? brandFilter ?? ''} className={input} required>
                  <option value="">انتخاب برند…</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <input name="name" defaultValue={edit?.name} placeholder="نام مدل (مثلاً کمری) *" className={input} required />
              <div>
                <label className="label">سالهای ساخت (با ویرگول)</label>
                <input
                  name="years"
                  defaultValue={edit?.years.map((y) => y.year).join(' ')}
                  placeholder="مثلاً 2018 2019 2020"
                  dir="ltr"
                  className={input}
                />
              </div>
              <div>
                <label className="label">نوع موتور (با ویرگول)</label>
                <input
                  name="engines"
                  defaultValue={edit?.engines.map((e) => e.name).join(', ')}
                  placeholder="مثلاً 2.5L بنزینی, 3.5L بنزینی"
                  className={input}
                />
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" className="btn-primary h-10">{edit ? 'ذخیره' : 'افزودن'}</button>
                {edit && <Link href="/admin/vehicles?tab=models" className="btn-ghost h-10">انصراف</Link>}
              </div>
            </form>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <form method="get" action="/admin/vehicles" className="flex items-center gap-2">
                <input type="hidden" name="tab" value="models" />
                <select name="brand" defaultValue={brandFilter} className="input h-10 w-64">
                  <option value="">همه برندها</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button type="submit" className="btn-outline h-10">فیلتر</button>
              </form>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredModels.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-50/60">
                  <div>
                    <p className="font-bold text-slate-800">
                      {m.name}
                      <span className="ms-2 text-xs font-normal text-brand-600">{m.brand.name}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {m.years.map((y) => (
                        <span key={y.id} className="badge bg-slate-100 text-slate-600" dir="ltr">{y.year}</span>
                      ))}
                      {m.years.length === 0 && <span className="text-xs text-slate-400">بدون سال</span>}
                    </div>
                    {m.engines.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {m.engines.map((e) => (
                          <span key={e.id} className="badge bg-brand-50 text-brand-700">{e.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/vehicles?tab=models&edit=${m.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
                    <form action={deleteVehicleModel}><input type="hidden" name="id" value={m.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
                  </div>
                </div>
              ))}
            </div>
            {filteredModels.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-400">مدلی ثبت نشده است</p>
            )}
          </div>
        </div>
      )}

      {/* ── Compatibility tab ── */}
      {tab === 'compat' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
          <div className="card h-fit p-5">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">افزودن سازگاری جدید</h2>
            <VehicleCompatForm products={products} />
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <h2 className="text-sm font-extrabold text-slate-900">سازگاریهای ثبتشده</h2>
              <p className="mt-0.5 text-xs text-slate-400">{new Intl.NumberFormat('fa-IR').format(compatibilities.length)} مورد (آخرین ۲۰۰)</p>
            </div>
            <div className="divide-y divide-slate-50">
              {compatibilities.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-slate-50/60">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-800">{c.product.name}</span>
                    <span className="text-slate-300">←</span>
                    <span className="badge bg-brand-50 text-brand-700">{c.vehicleBrand?.name}</span>
                    {c.vehicleModel && <span className="badge bg-slate-100 text-slate-600">{c.vehicleModel.name}</span>}
                    {c.vehicleYear && <span className="badge bg-slate-100 text-slate-600" dir="ltr">{c.vehicleYear.year}</span>}
                    {c.vehicleEngine && <span className="badge bg-slate-100 text-slate-600">{c.vehicleEngine.name}</span>}
                  </div>
                  <form action={deleteVehicleCompatibility}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
