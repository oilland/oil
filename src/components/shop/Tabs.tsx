'use client';

import { useState } from 'react';

export type TabItem = { id: string; label: string; content: React.ReactNode };

export function Tabs({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
              t.id === current.id
                ? 'border-brand-700 text-brand-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in">{current.content}</div>
    </div>
  );
}
