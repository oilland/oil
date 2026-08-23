'use client';

import { useRef, useState } from 'react';
import { IconPlus, IconTrash } from '@/components/icons';

const PRESETS = [
  '/images/products/placeholder.svg',
  '/images/banners/hero-1.jpg',
  '/images/banners/hero-2.jpg',
  '/images/banners/hero-3.jpg'
];

export function ImageEditor({ initial }: { initial: string[] }) {
  const [items, setItems] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = (i: number, v: string) => setItems((list) => list.map((x, idx) => (idx === i ? v : x)));
  const add = (url = '') => setItems((list) => [...list, url]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) add(data.url);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input type="hidden" name="images" value={items.filter(Boolean).join(',')} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((url, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl border border-slate-200">
            <img src={url || '/images/placeholder.svg'} alt="" className="aspect-square w-full object-cover" />
            <button
              type="button"
              onClick={() => setItems((list) => list.filter((_, idx) => idx !== i))}
              className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow"
              aria-label="حذف"
            >
              <IconTrash className="h-4 w-4" />
            </button>
            <input className="absolute inset-x-0 bottom-0 bg-white/90 px-2 py-1 text-[10px] focus:outline-none" dir="ltr" value={url} onChange={(e) => update(i, e.target.value)} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
        >
          <IconPlus className="h-6 w-6" />
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="badge border border-brand-300 bg-brand-50 text-brand-700 hover:border-brand-400">
          {busy ? 'در حال آپلود…' : '+ آپلود از کامپیوتر'}
        </button>
        {PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => add(p)} className="badge border border-slate-200 bg-slate-50 text-slate-500 hover:border-brand-400 hover:text-brand-700">
            {p.split('/').pop()}
          </button>
        ))}
      </div>
    </div>
  );
}
