'use client';

import { useState } from 'react';
import { IconFilter, IconX } from '@/components/icons';

export function FilterDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline mb-4 w-full lg:hidden"
      >
        <IconFilter className="h-4 w-4" />
        فیلترها و مرتب‌سازی
      </button>

      <aside className="hidden lg:block">{children}</aside>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <span className="text-sm font-extrabold">فیلترها</span>
              <button onClick={() => setOpen(false)} className="btn-ghost p-2" aria-label="بستن">
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4" onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
