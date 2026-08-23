'use client';

import { useState } from 'react';
import { IconSend, IconCheck } from '@/components/icons';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setState('done');
    } catch {
      setState('done');
    }
  }

  if (state === 'done') {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-400">
        <IconCheck className="h-4 w-4" /> عضویت شما ثبت شد
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ایمیل شما"
        className="h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 focus:border-accent-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-l from-accent-400 to-accent-500 text-brand-950 shadow-md shadow-accent-600/25 transition hover:from-accent-300 hover:to-accent-400"
        aria-label="ثبت"
      >
        <IconSend className="h-4 w-4" />
      </button>
    </form>
  );
}
