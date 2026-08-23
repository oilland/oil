import Link from 'next/link';
import { prisma } from '@/lib/db';
import { bulkProductAction, deleteProduct } from '@/actions/admin-product';
import { formatPrice } from '@/lib/format';
import { Flash } from '@/components/ui';
import { IconSearch, IconEdit, IconTrash, IconPackage } from '@/components/icons';

const PER_PAGE = 15;

export const metadata = { title: 'مدیریت محصولات' };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    deletedAt: null,
    ...(q ? { name: { contains: q } } : {})
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { brand: true, category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } }
    }),
    prisma.product.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">محصولات</h1>
          <p className="mt-1 text-sm text-slate-500">{new Intl.NumberFormat('fa-IR').format(total)} محصول</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">+ محصول جدید</Link>
      </div>

      <Flash searchParams={sp} />

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <form action="/admin/products" className="relative flex-1 min-w-52">
            <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="جستجوی محصول…" className="input h-10 pr-9" />
          </form>

          <form id="bulk" action={bulkProductAction} className="flex items-center gap-2">
            <select name="action" className="input h-10 w-44" defaultValue="publish">
              <option value="publish">انتشار</option>
              <option value="unpublish">عدم انتشار</option>
              <option value="feature">علامت ویژه</option>
              <option value="delete">حذف</option>
            </select>
            <button type="submit" className="btn-outline h-10">اعمال گروهی</button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
                <th className="w-10 p-3"><input type="checkbox" className="h-4 w-4 accent-brand-700" /></th>
                <th className="p-3 font-medium">محصول</th>
                <th className="p-3 font-medium">برند</th>
                <th className="p-3 font-medium">دسته‌بندی</th>
                <th className="p-3 font-medium">قیمت</th>
                <th className="p-3 font-medium">موجودی</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <input type="checkbox" name="ids" value={p.id} form="bulk" className="h-4 w-4 accent-brand-700" />
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <img src={p.images[0]?.url ?? '/images/placeholder.svg'} alt="" className="h-10 w-10 rounded-lg border border-slate-100 object-cover" />
                      <span className="max-w-56 truncate font-medium text-slate-800">{p.name}</span>
                    </Link>
                  </td>
                  <td className="p-3 text-slate-600">{p.brand?.name ?? '—'}</td>
                  <td className="p-3 text-slate-600">{p.category?.name ?? '—'}</td>
                  <td className="p-3">
                    <span className="font-bold text-slate-800">{formatPrice(p.price)}</span>
                    {p.salePrice && <span className="block text-xs text-red-600">{formatPrice(p.salePrice)}</span>}
                  </td>
                  <td className="p-3">
                    <span className={`badge ${p.stock <= 0 ? 'bg-red-100 text-red-700' : p.stock <= p.lowStockThreshold ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.stock <= 0 ? 'ناموجود' : new Intl.NumberFormat('fa-IR').format(p.stock)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`badge ${p.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/products/${p.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش">
                        <IconEdit className="h-4 w-4" />
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف">
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <IconPackage className="h-8 w-8" />
              <p className="text-sm">محصولی یافت نشد</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 p-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/admin/products?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${p === page ? 'bg-brand-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {new Intl.NumberFormat('fa-IR').format(p)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
