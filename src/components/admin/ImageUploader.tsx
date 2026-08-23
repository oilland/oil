'use client';

import { useRef, useState } from 'react';
import { IconImage } from '@/components/icons';

/**
 * Image uploader + URL field.
 * Renders a hidden input named `name` so it works inside server-action forms.
 * Usage: <ImageUploader name="image" defaultValue="/x.jpg" label="تصویر" />
 */
export function ImageUploader({
  name,
  defaultValue = '',
  label = 'تصویر'
}: {
  name: string;
  defaultValue?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // When the parent form switches between "new" and "edit", the component may
  // be reused (same position) and defaultValue changes — keep value in sync.
  const [lastDefault, setLastDefault] = useState(defaultValue || '');
  if (defaultValue !== lastDefault && !value) {
    setLastDefault(defaultValue || '');
    setValue(defaultValue || '');
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'خطا در آپلود');
        return;
      }
      setValue(data.url);
    } catch {
      setError('خطا در برقراری ارتباط');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />

      {value ? (
        <div className="mb-2 flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-500" dir="ltr">{value}</p>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-semibold text-brand-700 hover:underline">
                تعویض
              </button>
              <button type="button" onClick={() => setValue('')} className="text-xs font-semibold text-red-600 hover:underline">
                حذف
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 transition hover:border-brand-500 hover:text-brand-700"
        >
          <IconImage className="h-5 w-5" />
          {busy ? 'در حال آپلود…' : `آپلود ${label}`}
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {busy && <p className="text-xs text-slate-400">در حال آپلود، لطفاً صبر کنید…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="یا آدرس تصویر را تایپ کنید…"
        className="input mt-2 h-10 text-xs"
        dir="ltr"
      />
    </div>
  );
}
