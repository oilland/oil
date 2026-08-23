'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconChevronDown, IconSearch } from '@/components/icons';

type Opt = { id: string; name: string };

export function VehicleSelector() {
  const [brands, setBrands] = useState<Opt[]>([]);
  const [models, setModels] = useState<Opt[]>([]);
  const [years, setYears] = useState<{ id: string; year: number }[]>([]);
  const [engines, setEngines] = useState<Opt[]>([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/vehicle').then((r) => r.json()).then((d) => setBrands(d));
  }, []);

  useEffect(() => {
    if (!brand) return;
    setLoading(true);
    setModels([]); setYears([]); setEngines([]); setModel(''); setYear(''); setEngine('');
    fetch(`/api/vehicle?brand=${brand}`).then((r) => r.json()).then((d) => {
      setModels(d.models);
      setLoading(false);
    });
  }, [brand]);

  useEffect(() => {
    if (!model) return;
    setLoading(true);
    setYears([]); setEngines([]); setYear(''); setEngine('');
    fetch(`/api/vehicle?brand=${brand}&model=${model}`).then((r) => r.json()).then((d) => {
      setYears(d.years);
      setEngines(d.engines);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  const query = new URLSearchParams();
  if (brand) query.set('vb', brand);
  if (model) query.set('vm', model);
  if (year) query.set('vy', year);
  if (engine) query.set('ve', engine);

  const selectCls =
    'h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { value: brand, set: setBrand, options: brands, placeholder: 'برند خودرو', disabled: false },
        { value: model, set: setModel, options: models, placeholder: 'مدل', disabled: !brand },
        {
          value: year,
          set: setYear,
          options: years.map((y) => ({ id: y.id, name: String(y.year) })),
          placeholder: 'سال ساخت',
          disabled: !model
        },
        { value: engine, set: setEngine, options: engines, placeholder: 'نوع موتور', disabled: !model }
      ].map((sel) => (
        <div key={sel.placeholder} className="relative">
          <select
            className={selectCls}
            value={sel.value}
            disabled={sel.disabled || loading}
            onChange={(e) => (sel.set as (v: string) => void)(e.target.value)}
          >
            <option value="">{sel.placeholder}</option>
            {sel.options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <IconChevronDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      ))}
      <Link
        href={brand || model ? `/products?${query.toString()}` : '/products'}
        className="col-span-full mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-800 px-6 text-sm font-bold text-white transition hover:bg-brand-900 lg:col-span-4"
      >
        <IconSearch className="h-4 w-4" />
        {brand || model ? 'نمایش محصولات سازگار' : 'مشاهده همه محصولات'}
      </Link>
    </div>
  );
}
