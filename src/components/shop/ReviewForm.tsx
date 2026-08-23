'use client';

import { useState } from 'react';
import { IconStar, IconCheck } from '@/components/icons';

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    const form = new FormData(e.currentTarget);
    const body = {
      productId,
      name: form.get('name'),
      rating,
      title: form.get('title'),
      body: form.get('body')
    };
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'خطایی رخ داد');
        setState('idle');
        return;
      }
      setState('done');
    } catch {
      setError('خطایی رخ داد');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
        <IconCheck className="h-5 w-5" />
        دیدگاه شما ثبت شد و پس از تایید نمایش داده می‌شود.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="label">امتیاز شما</p>
        <div className="flex items-center gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5"
              aria-label={`${i} ستاره`}
            >
              <IconStar
                className={`h-6 w-6 ${i <= (hover || rating) ? 'fill-accent-400 text-accent-400' : 'fill-slate-200 text-slate-200'}`}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="rv-name">نام شما</label>
          <input id="rv-name" name="name" required className="input" placeholder="نام و نام خانوادگی" />
        </div>
        <div>
          <label className="label" htmlFor="rv-title">عنوان دیدگاه</label>
          <input id="rv-title" name="title" className="input" placeholder="خلاصه تجربه شما" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="rv-body">متن دیدگاه</label>
        <textarea id="rv-body" name="body" required rows={4} className="input resize-none" placeholder="تجربه خود از این محصول را بنویسید…" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={state === 'loading'} className="btn-primary">
        {state === 'loading' ? 'در حال ثبت…' : 'ثبت دیدگاه'}
      </button>
    </form>
  );
}
