'use client';

import { useState } from 'react';

export function ProductGallery({ images }: { images: { url: string; alt: string | null }[] }) {
  const list = images.length > 0 ? images : [{ url: '/images/placeholder.svg', alt: '' }];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {list.length > 1 && (
        <div className="flex gap-2 md:flex-col">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === active ? 'border-brand-600' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <img
          src={list[active].url}
          alt={list[active].alt ?? ''}
          className="aspect-square w-full object-cover"
        />
      </div>
    </div>
  );
}
