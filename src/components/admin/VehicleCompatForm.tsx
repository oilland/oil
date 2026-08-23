'use client';

import { useEffect, useState } from 'react';
import { addVehicleCompatibility } from '@/actions/admin-vehicles';
import { IconChevronDown, IconSearch, IconPlus } from '@/components/icons';

type Opt = { id: string; name: string };
type YearOpt = { id: string; year: number };

export function VehicleCompatForm({ products }: { products: { id: string; name: string }[] }) {
  const [brands, setBrands] = useState<Opt[]>([]);
  const [models, setModels] = useState<Opt[]>([]);
  const [years, setYears] = useState<YearOpt[]>([]);
  const [engines, setEngines] = useState<Opt[]>([]);

  const [productId, setProductId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [yearId, setYearId] = useState('');
  const [engineId, setEngineId] = useState('');

  const [productFilter, setProductFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/vehicle').then((r) => r.json()).then((d) => setBrands(d));
  }, []);

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    setModels([]); setYears([]); setEngines([]); setModelId(''); setYearId(''); setEngineId('');
    fetch(`/api/vehicle?brand=${brandId}`).then((r) => r.json()).then((d) => {
      setModels(d.models);
      setLoading(false);
    });
  }, [brandId]);

  useEffect(() => {
    if (!modelId) return;
    setLoading(true);
    setYears([]); setEngines([]); setYearId(''); setEngineId('');
    fetch(`/api/vehicle?brand=${brandId}&model=${modelId}`).then((r) => r.json()).then((d) => {
      setYears(d.years);
      setEngines(d.engines);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  const filtered = products.filter((p) => p.name.includes(productFilter));

  const selectCls =
    'h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
  const labelCls = 'label';

  return (
    <form action={addVehicleCompatibility} className="space-y-4">
      {/* Product */}
      <div>
        <label className={labelCls} htmlFor="vp-product">محصول *</label>
        <div className="relative mb-1.5">
          <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            placeholder="جستجوی محصول…"
            className="input h-10 pr-9"
          />
        </div>
        <select
          id="vp-product"
          name="productId"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className={selectCls}
          required
        >
          <option value="">انتخاب محصول…</option>
          {filtered.slice(0, 200).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Vehicle cascade */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="vp-brand">برند خودرو *</label>
          <select id="vp-brand" name="vehicleBrandId" value={brandId} onChange={(e) => setBrandId(e.target.value)} className={selectCls} required>
            <option value="">انتخاب برند…</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="vp-model">مدل</label>
          <select id="vp-model" name="vehicleModelId" value={modelId} onChange={(e) => setModelId(e.target.value)} className={selectCls} disabled={!brandId || loading}>
            <option value="">انتخاب مدل…</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="vp-year">سال ساخت</label>
          <select id="vp-year" name="vehicleYearId" value={yearId} onChange={(e) => setYearId(e.target.value)} className={selectCls} disabled={!modelId || loading}>
            <option value="">همه سال‌ها</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="vp-engine">نوع موتور</label>
          <select id="vp-engine" name="vehicleEngineId" value={engineId} onChange={(e) => setEngineId(e.target.value)} className={selectCls} disabled={!modelId || loading}>
            <option value="">همه موتورها</option>
            {engines.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        <IconPlus className="h-4 w-4" />
        افزودن سازگاری
      </button>
      {loading && <p className="text-xs text-slate-400">در حال بارگذاری…</p>}
      <p className="text-xs text-slate-400">
        می‌توانید سازگاری را فقط تا سطح برند/مدل ثبت کنید (بدون سال و موتور) یا دقیق‌تر کنید.
      </p>
    </form>
  );
}
