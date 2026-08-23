import Link from 'next/link';
import { IconFilter } from '@/components/icons';
import { CategoryAccordion, type NavCategory } from './CategoryAccordion';

type Options = {
  categories: NavCategory[];
  brands: { id: string; name: string; slug: string }[];
  viscosity: string[];
  volume: string[];
  type: string[];
};

export function Filters({ options, current }: { options: Options; current: Record<string, string> }) {
  const inputCls = 'input h-10 rounded-lg bg-white text-sm';

  // Only carry forward params that don't have a visible control in this form,
  // so the user's new selections are never overridden by stale hidden values.
  const passthrough = ['q', 'sort', 'offer', 'vb', 'vm', 'vy', 've'];

  return (
    <form action="/products" method="get" className="space-y-5">
      {passthrough.map((k) =>
        current[k] ? <input key={k} type="hidden" name={k} value={current[k]} /> : null
      )}

      <div>
        <p className="label">دسته‌بندی</p>
        <input type="hidden" name="cat" value={current.cat ?? ''} />
        <div className="rounded-xl border border-slate-200 p-1">
          <CategoryAccordion categories={options.categories} />
        </div>
      </div>

      <div>
        <p className="label">برند</p>
        <select name="brand" className={inputCls} defaultValue={current.brand ?? ''}>
          <option value="">همه برندها</option>
          {options.brands.map((b) => (
            <option key={b.id} value={b.slug}>{b.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="label">محدوده قیمت (تومان)</p>
        <div className="flex items-center gap-2">
          <input type="number" name="min" placeholder="از" className={inputCls} defaultValue={current.min ?? ''} />
          <span className="text-slate-400">—</span>
          <input type="number" name="max" placeholder="تا" className={inputCls} defaultValue={current.max ?? ''} />
        </div>
      </div>

      {options.viscosity.length > 0 && (
        <div>
          <p className="label">گرانروی (ویسکوزیته)</p>
          <select name="viscosity" className={inputCls} defaultValue={current.viscosity ?? ''}>
            <option value="">همه</option>
            {options.viscosity.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )}

      {options.type.length > 0 && (
        <div>
          <p className="label">نوع روغن</p>
          <select name="type" className={inputCls} defaultValue={current.type ?? ''}>
            <option value="">همه</option>
            {options.type.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )}

      {options.volume.length > 0 && (
        <div>
          <p className="label">حجم</p>
          <select name="volume" className={inputCls} defaultValue={current.volume ?? ''}>
            <option value="">همه</option>
            {options.volume.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="inStock" value="1" defaultChecked={current.inStock === '1'} className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />
        فقط کالاهای موجود
      </label>

      <button type="submit" className="btn-primary w-full">
        <IconFilter className="h-4 w-4" />
        اعمال فیلتر
      </button>
      {Object.keys(current).length > 0 && (
        <Link href="/products" className="btn-ghost w-full !text-xs text-slate-500">
          حذف همه فیلترها
        </Link>
      )}
    </form>
  );
}
