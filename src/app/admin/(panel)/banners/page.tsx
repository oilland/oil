import Link from 'next/link';
import { prisma } from '@/lib/db';
import { saveBanner, deleteBanner } from '@/actions/admin-marketing';
import { Flash } from '@/components/ui';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { IconEdit, IconTrash } from '@/components/icons';

export const metadata = { title: 'بنرها' };

export default async function BannersPage({ searchParams }: { searchParams: Promise<{ edit?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === 'string' ? sp.edit : null;

  const [banners, edit] = await Promise.all([
    prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } }),
    editId ? prisma.banner.findUnique({ where: { id: editId } }) : null
  ]);

  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">بنرها</h1>
      <Flash searchParams={sp} />

      <div className="mb-6 card p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">{edit ? 'ویرایش بنر' : 'بنر جدید'}</h2>
        <form action={saveBanner} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <input name="title" defaultValue={edit?.title ?? ''} placeholder="عنوان" className={input} />
          <input name="subtitle" defaultValue={edit?.subtitle ?? ''} placeholder="زیرعنوان" className={input} />
          <input name="buttonText" defaultValue={edit?.buttonText ?? ''} placeholder="متن دکمه" className={input} />
          <input name="url" defaultValue={edit?.url ?? ''} placeholder="لینک (مثلاً /products)" dir="ltr" className={input} />
          <div>
            <label className="label">{edit ? 'تصویر دسکتاپ (اختیاری — در صورت خالی ماندن، تصویر قبلی حفظ می‌شود)' : 'تصویر دسکتاپ *'}</label>
            <ImageUploader name="image" defaultValue={edit?.image ?? ''} label="تصویر دسکتاپ" />
          </div>
          <div>
            <label className="label">تصویر موبایل (اختیاری)</label>
            <ImageUploader name="mobileImage" defaultValue={edit?.mobileImage ?? ''} label="تصویر موبایل" />
          </div>
          <div>
            <label className="label">بخش</label>
            <select name="section" defaultValue={edit?.section ?? 'hero'} className={input}>
              <option value="hero">بنر اصلی</option>
              <option value="promo">بنر تبلیغاتی</option>
              <option value="cta">دعوت به اقدام</option>
            </select>
          </div>
          <input name="sortOrder" type="number" defaultValue={edit?.sortOrder ?? 0} placeholder="ترتیب نمایش" className={input} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="h-4 w-4 accent-brand-700" /> فعال
          </label>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary h-10">{edit ? 'ذخیره' : 'افزودن'}</button>
            {edit && <Link href="/admin/banners" className="btn-ghost h-10">انصراف</Link>}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="card overflow-hidden">
            <div className="relative h-32">
              <img src={b.image} alt={b.title ?? ''} className="h-full w-full object-cover" />
              <span className={`badge absolute right-2 top-2 ${b.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>{b.isActive ? 'فعال' : 'غیرفعال'}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-bold text-slate-800">{b.title || 'بدون عنوان'}</p>
                <p className="text-xs text-slate-400">بخش: {b.section} · ترتیب: {b.sortOrder}</p>
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/admin/banners?edit=${b.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="ویرایش"><IconEdit className="h-4 w-4" /></Link>
                <form action={deleteBanner}><input type="hidden" name="id" value={b.id} /><button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><IconTrash className="h-4 w-4" /></button></form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
