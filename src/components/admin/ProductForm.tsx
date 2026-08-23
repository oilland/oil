import Link from 'next/link';
import { saveProduct } from '@/actions/admin-product';
import { SpecEditor } from './SpecEditor';
import { ImageEditor } from './ImageEditor';
import { IconArrowRight } from '@/components/icons';

type Options = {
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
};

export type ProductFormData = {
  id?: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  brandId: string | null;
  categoryId: string | null;
  price: number;
  salePrice: number | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  lowStockThreshold: number;
  isPublished: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { url: string }[];
  specs: { group: string; name: string; value: string }[];
};

export function ProductForm({ product, options }: { product: ProductFormData | null; options: Options }) {
  const p = product;
  return (
    <form action={saveProduct} className="space-y-6">
      {p?.id && <input type="hidden" name="id" value={p.id} />}

      <div className="card p-6">
        <h2 className="mb-5 text-base font-extrabold text-slate-900">اطلاعات پایه</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">نام محصول *</label>
            <input name="name" defaultValue={p?.name} className="input" placeholder="مثلاً روغن موتور ایرانول رانا 5W-30" />
          </div>
          <div>
            <label className="label">برند</label>
            <select name="brandId" defaultValue={p?.brandId ?? ''} className="input">
              <option value="">بدون برند</option>
              {options.brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">دسته‌بندی</label>
            <select name="categoryId" defaultValue={p?.categoryId ?? ''} className="input">
              <option value="">بدون دسته‌بندی</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">توضیح کوتاه</label>
            <input name="shortDescription" defaultValue={p?.shortDescription ?? ''} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">توضیحات کامل</label>
            <textarea name="description" rows={4} defaultValue={p?.description ?? ''} className="input resize-none" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-5 text-base font-extrabold text-slate-900">قیمت و موجودی</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">قیمت (تومان) *</label>
            <input name="price" type="number" defaultValue={p?.price ?? ''} className="input" />
          </div>
          <div>
            <label className="label">قیمت با تخفیف</label>
            <input name="salePrice" type="number" defaultValue={p?.salePrice ?? ''} className="input" />
          </div>
          <div>
            <label className="label">موجودی انبار</label>
            <input name="stock" type="number" defaultValue={p?.stock ?? 0} className="input" />
          </div>
          <div>
            <label className="label">آستانه هشدار موجودی</label>
            <input name="lowStockThreshold" type="number" defaultValue={p?.lowStockThreshold ?? 5} className="input" />
          </div>
          <div>
            <label className="label">کد SKU</label>
            <input name="sku" defaultValue={p?.sku ?? ''} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">بارکد</label>
            <input name="barcode" defaultValue={p?.barcode ?? ''} className="input" dir="ltr" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-5 text-base font-extrabold text-slate-900">تصاویر</h2>
        <ImageEditor initial={p?.images.map((i) => i.url) ?? []} />
      </div>

      <div className="card p-6">
        <h2 className="mb-5 text-base font-extrabold text-slate-900">مشخصات فنی</h2>
        <SpecEditor initial={p?.specs ?? []} />
      </div>

      <div className="card p-6">
        <h2 className="mb-5 text-base font-extrabold text-slate-900">وضعیت نمایش</h2>
        <div className="flex flex-wrap gap-6">
          {[
            { name: 'isPublished', label: 'منتشر شده', def: p?.isPublished ?? true },
            { name: 'isFeatured', label: 'محصول ویژه', def: p?.isFeatured ?? false },
            { name: 'isBestSeller', label: 'پرفروش', def: p?.isBestSeller ?? false }
          ].map((c) => (
            <label key={c.name} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name={c.name} defaultChecked={c.def} className="h-4 w-4 rounded border-slate-300 accent-brand-700" />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-5 text-base font-extrabold text-slate-900">سئو</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label">عنوان سئو</label>
            <input name="seoTitle" defaultValue={p?.seoTitle ?? ''} className="input" />
          </div>
          <div>
            <label className="label">توضیحات متا</label>
            <textarea name="seoDescription" rows={2} defaultValue={p?.seoDescription ?? ''} className="input resize-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/admin/products" className="btn-ghost">
          <IconArrowRight className="h-4 w-4" />
          بازگشت
        </Link>
        <button type="submit" className="btn-primary !px-8">ذخیره محصول</button>
      </div>
    </form>
  );
}
