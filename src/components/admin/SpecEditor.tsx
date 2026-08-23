'use client';

import { useState } from 'react';
import { IconPlus, IconTrash } from '@/components/icons';

export type SpecRow = { group: string; name: string; value: string };

export function SpecEditor({ initial }: { initial: SpecRow[] }) {
  const [rows, setRows] = useState<SpecRow[]>(
    initial.length > 0 ? initial : [{ group: 'مشخصات فنی', name: '', value: '' }]
  );

  const update = (i: number, k: keyof SpecRow, v: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  return (
    <div>
      <input type="hidden" name="specs" value={JSON.stringify(rows)} />
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
            <input className="input" placeholder="گروه (مثلاً مشخصات فنی)" value={row.group} onChange={(e) => update(i, 'group', e.target.value)} />
            <input className="input" placeholder="نام ویژگی (مثلاً ویسکوزیته)" value={row.name} onChange={(e) => update(i, 'name', e.target.value)} />
            <input className="input" placeholder="مقدار (مثلاً 5W-30)" value={row.value} onChange={(e) => update(i, 'value', e.target.value)} />
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="حذف"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((r) => [...r, { group: 'مشخصات فنی', name: '', value: '' }])}
        className="btn-ghost mt-2 !text-brand-700"
      >
        <IconPlus className="h-4 w-4" /> افزودن ویژگی
      </button>
    </div>
  );
}
