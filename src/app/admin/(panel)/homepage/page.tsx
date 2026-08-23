import Link from 'next/link';
import { prisma } from '@/lib/db';
import { saveHomepageSection, moveHomepageSection } from '@/actions/admin-content';
import { Flash } from '@/components/ui';
import { IconChevronUp, IconChevronDown } from '@/components/icons';

export const metadata = { title: 'بخش‌های صفحه اصلی' };

const SECTION_LABELS: Record<string, string> = {
  hero: 'بنر اصلی (اسلایدر)',
  categories: 'دسته‌بندی محصولات',
  featured: 'محصولات ویژه',
  bestsellers: 'پرفروش‌ترین‌ها',
  offers: 'پیشنهادهای شگفت‌انگیز',
  vehicle: 'انتخاب روغن خودرو',
  brands: 'برندهای معتبر',
  whyus: 'چرا روغن‌لند؟',
  blog: 'آخرین مقالات',
  testimonials: 'نظرات مشتریان',
  newsletter: 'خبرنامه'
};

export default async function HomepagePage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } });
  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-2 text-xl font-extrabold text-slate-900">بخش‌های صفحه اصلی</h1>
      <p className="mb-6 text-sm text-slate-500">هر بخش را فعال/غیرفعال کنید، ترتیب و متن‌هایش را عوض کنید.</p>
      <Flash searchParams={sp} />

      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={s.id} className={`card flex flex-col gap-3 p-4 lg:flex-row lg:items-center ${s.enabled ? '' : 'opacity-60'}`}>
            <div className="flex w-full items-center gap-2 lg:w-56">
              <span className={`badge ${s.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {s.enabled ? 'فعال' : 'غیرفعال'}
              </span>
              <span className="text-sm font-bold text-slate-800">{SECTION_LABELS[s.key] ?? s.key}</span>
              <span className="text-xs text-slate-400">({new Intl.NumberFormat('fa-IR').format(i + 1)})</span>
            </div>

            <form action={saveHomepageSection} className="flex flex-1 flex-col gap-3 sm:flex-row">
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="sortOrder" value={s.sortOrder} />
              <input name="title" defaultValue={s.title ?? ''} placeholder="عنوان بخش" className={`${input} flex-1`} />
              <input name="subtitle" defaultValue={s.subtitle ?? ''} placeholder="زیرعنوان" className={`${input} flex-1`} />
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-700">
                  <input type="checkbox" name="enabled" defaultChecked={s.enabled} className="h-4 w-4 accent-brand-700" />
                  نمایش
                </label>
                <button type="submit" className="btn-primary h-10 !py-1.5 text-xs">ذخیره</button>
              </div>
            </form>

            <div className="flex items-center">
              <form action={moveHomepageSection}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="dir" value="1" />
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="بالا"><IconChevronUp className="h-4 w-4" /></button>
              </form>
              <form action={moveHomepageSection}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="dir" value="-1" />
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="پایین"><IconChevronDown className="h-4 w-4" /></button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        💡 محتوای بنرها از بخش <Link href="/admin/banners" className="font-bold text-brand-700">بنرها</Link>،
        محصولات ویژه از <Link href="/admin/products" className="font-bold text-brand-700">محصولات</Link> و
        نظرات از بخش <Link href="/admin/testimonials" className="font-bold text-brand-700">نظرات مشتریان</Link> مدیریت می‌شوند.
      </div>
    </div>
  );
}
