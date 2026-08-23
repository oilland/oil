'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconChevronLeft, IconChevronRight, IconBolt } from '@/components/icons';

export type Slide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  url: string | null;
  image: string;
};

export function BannerSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), 5500);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;

  return (
    <div className="group relative overflow-hidden rounded-3xl shadow-soft">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={s.id} className="relative w-full shrink-0 overflow-hidden" style={{ aspectRatio: '16/7' }}>
            <img
              src={s.image}
              alt={s.title ?? ''}
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                i === index ? 'scale-110' : 'scale-100'
              }`}
            />
            {/* dark gradient bottom + subtle right for RTL text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-3/5 bg-gradient-to-l from-black/50 to-transparent" />

            {/* text — bottom right (RTL) */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-start justify-end gap-2 p-6 pb-7 md:p-12 md:pb-12">
              {s.title && (
                <h2 className="max-w-xl text-2xl font-black leading-snug text-white drop-shadow-lg md:text-4xl">
                  {s.title}
                </h2>
              )}
              {s.subtitle && (
                <p className="max-w-md text-sm text-slate-100 drop-shadow md:text-lg">{s.subtitle}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {s.buttonText && s.url && (
                  <Link href={s.url} className="btn-accent !px-7 !py-3 !text-base">
                    {s.buttonText}
                    <IconChevronLeft className="h-5 w-5" />
                  </Link>
                )}
                <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur sm:flex">
                  <IconBolt className="h-4 w-4 text-accent-300" />
                  ضمانت اصالت کالا
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* arrows */}
      {n > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + n) % n)}
            className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition hover:bg-white/30 group-hover:opacity-100 md:flex"
            aria-label="قبلی"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % n)}
            className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition hover:bg-white/30 group-hover:opacity-100 md:flex"
            aria-label="بعدی"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* dots with progress feel */}
      {n > 1 && (
        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 gap-1.5 md:flex">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-7 bg-accent-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`اسلاید ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
