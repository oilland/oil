'use client';

import { useState } from 'react';
import { saveRolePermissions } from '@/actions/admin-other';

export function RoleEditor({
  role,
  permissions,
  selected
}: {
  role: { id: string; name: string; slug: string; description: string | null; isSystem: boolean };
  permissions: { id: string; name: string; slug: string; group: string }[];
  selected: string[];
}) {
  const [ids, setIds] = useState<string[]>(selected);

  const toggle = (id: string) =>
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const groups = new Map<string, typeof permissions>();
  for (const p of permissions) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group)!.push(p);
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-800">{role.name}</p>
          <p className="text-xs text-slate-400" dir="ltr">{role.slug}{role.isSystem ? ' · سیستمی' : ''}</p>
        </div>
        <span className="badge bg-brand-50 text-brand-700">{new Intl.NumberFormat('fa-IR').format(ids.length)} دسترسی</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from(groups.entries()).map(([group, perms]) => (
          <div key={group}>
            <p className="mb-2 text-xs font-bold text-slate-500">{group}</p>
            <div className="space-y-1.5">
              {perms.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={ids.includes(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4 rounded accent-brand-700" />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form action={saveRolePermissions} className="mt-5">
        <input type="hidden" name="roleId" value={role.id} />
        <input type="hidden" name="permissions" value={ids.join(',')} />
        <button type="submit" className="btn-primary h-10">ذخیره دسترسی‌ها</button>
      </form>
    </div>
  );
}
