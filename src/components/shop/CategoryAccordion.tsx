'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconChevronDown } from '@/components/icons';

export type NavCategory = { id: string; name: string; slug: string; children: NavCategory[] };

/**
 * آکاردئون دسته‌بندی‌ها — کل ردیف (اسم + فلش) یک دکمه است.
 * کلیک روی اسم، زیرمجموعه‌ها را باز/بسته می‌کند.
 * برای رفتن به صفحهٔ خودِ والد، لینک «همهٔ {نام}» اول زیرمجموعه‌ها قرار می‌گیرد.
 */
export function CategoryAccordion({
  categories,
  onNavigate
}: {
  categories: NavCategory[];
  onNavigate?: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      {categories.map((c) => {
        const hasChildren = c.children.length > 0;
        const isOpen = openId === c.id;
        return (
          <div key={c.id}>
            {/* کل ردیف یک دکمه — کلیک روی اسم یا فلش، زیرمجموعه را باز می‌کند */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : c.id)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <span>{c.name}</span>
              {hasChildren && (
                <IconChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>
            {hasChildren && isOpen && (
              <div className="mb-1 ms-3 animate-fade-in border-r border-slate-200 pr-2">
                <Link
                  href={`/products?cat=${c.slug}`}
                  onClick={onNavigate}
                  className="block rounded-lg px-3 py-1.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
                >
                  همهٔ {c.name}
                </Link>
                {c.children.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/products?cat=${ch.slug}`}
                    onClick={onNavigate}
                    className="block rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-brand-700"
                  >
                    {ch.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
