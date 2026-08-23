'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useShop, QtyPicker } from './CartProvider';
import { EmptyState } from '@/components/ui';
import { IconCart, IconTrash, IconTag, IconCheck } from '@/components/icons';

export function CartView({
  currencyLabel,
  freeShippingThreshold
}: {
  currencyLabel: string;
  freeShippingThreshold: number;
}) {
  const { cart, removeFromCart, setQty, subtotal } = useShop();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<{ discount: number; freeShipping: boolean } | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const fmt = new Intl.NumberFormat('fa-IR');

  if (cart.length === 0) {
    return (
      <EmptyState
        icon={<IconCart className="h-7 w-7" />}
        title="سبد خرید شما خالی است"
        message="برای شروع خرید، محصولات موردنظر خود را به سبد اضافه کنید."
      >
        <Link href="/products" className="btn-primary">مشاهده محصولات</Link>
      </EmptyState>
    );
  }

  const discount = coupon?.discount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const freeShip = coupon?.freeShipping || afterDiscount >= freeShippingThreshold;
  const shipping = freeShip ? 0 : 45000;
  const total = afterDiscount + shipping;

  async function applyCoupon() {
    if (!code.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const d = await res.json();
      if (res.ok && d.valid) {
        setCoupon({ discount: d.discount, freeShipping: d.freeShipping });
        localStorage.setItem('oilshop_coupon', code.trim().toUpperCase());
        setMsg(d.message);
      } else {
        setCoupon(null);
        setMsg(d.message ?? 'کد نامعتبر است');
      }
    } catch {
      setMsg('خطا در بررسی کد');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {cart.map((item) => (
          <div key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <Link href={`/products/${item.slug}`} className="shrink-0">
              <img src={item.image} alt={item.name} className="h-24 w-24 rounded-xl border border-slate-100 object-cover" />
            </Link>
            <div className="flex-1">
              <Link href={`/products/${item.slug}`} className="mb-1 block text-sm font-bold text-slate-800 hover:text-brand-700">
                {item.name}
              </Link>
              <p className="text-xs text-slate-400">
                {fmt.format(item.salePrice ?? item.price)} {currencyLabel}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
              <QtyPicker value={item.qty} onChange={(v) => setQty(item.id, v)} max={Math.max(1, item.stock)} />
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-slate-900">
                  {fmt.format((item.salePrice ?? item.price) * item.qty)}
                  <span className="ms-1 text-xs font-medium text-slate-400">{currencyLabel}</span>
                </span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="حذف"
                >
                  <IconTrash className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <Link href="/products" className="btn-ghost !px-0 text-brand-700">← ادامه خرید</Link>
      </div>

      <div className="h-fit space-y-4 lg:sticky lg:top-32">
        <div className="card p-5">
          <h2 className="mb-4 text-base font-extrabold text-slate-900">خلاصه سفارش</h2>

          {/* Coupon */}
          <div className="mb-4">
            <label className="label">کد تخفیف</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IconTag className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثلاً WELCOME10"
                  className="input h-10 pr-9"
                />
              </div>
              <button onClick={applyCoupon} disabled={busy} className="btn-outline h-10 shrink-0">
                {busy ? '…' : 'اعمال'}
              </button>
            </div>
            {msg && (
              <p className={`mt-1.5 flex items-center gap-1 text-xs ${coupon ? 'text-emerald-600' : 'text-red-500'}`}>
                {coupon && <IconCheck className="h-3.5 w-3.5" />}
                {msg}
              </p>
            )}
          </div>

          <dl className="space-y-2.5 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">جمع کالاها</dt>
              <dd className="font-semibold text-slate-800">{fmt.format(subtotal)} {currencyLabel}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>تخفیف</dt>
                <dd className="font-semibold">−{fmt.format(discount)} {currencyLabel}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">هزینه ارسال</dt>
              <dd className="font-semibold text-slate-800">
                {freeShip ? <span className="text-emerald-600">رایگان</span> : `${fmt.format(shipping)} ${currencyLabel}`}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
              <dt className="font-bold text-slate-900">مبلغ قابل پرداخت</dt>
              <dd className="font-black text-brand-800">{fmt.format(total)} {currencyLabel}</dd>
            </div>
          </dl>

          {!freeShip && (
            <p className="mt-3 rounded-lg bg-accent-50 p-2.5 text-xs text-accent-700">
              با {fmt.format(freeShippingThreshold - afterDiscount)} خرید بیشتر، ارسال رایگان می‌شود.
            </p>
          )}

          <Link href="/checkout" className="btn-primary mt-4 w-full !py-3">ادامه فرآیند خرید</Link>
        </div>
      </div>
    </div>
  );
}
