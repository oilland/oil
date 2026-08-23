'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useShop } from './CartProvider';
import { IRANIAN_PROVINCES } from '@/lib/constants';
import { IconCheck, IconCart } from '@/components/icons';

type ShippingMethod = { id: string; name: string; description: string | null; price: number; estimatedDays: string | null };

type CardSettings = {
  bankName: string;
  holderName: string;
  cardNumber: string;
  sheba: string;
  receiptApp: string;
  receiptNumber: string;
  note: string;
};

export function CheckoutForm({
  shippingMethods,
  freeShippingThreshold,
  currencyLabel,
  session,
  cardSettings
}: {
  shippingMethods: ShippingMethod[];
  freeShippingThreshold: number;
  currencyLabel: string;
  session: { name: string; email?: string; phone?: string } | null;
  cardSettings: CardSettings;
}) {
  const { cart, subtotal, clearCart } = useShop();
  const router = useRouter();
  const fmt = new Intl.NumberFormat('fa-IR');

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function copyCardNumber() {
    const digits = cardSettings.cardNumber.replace(/[^0-9]/g, '');
    try {
      await navigator.clipboard.writeText(digits);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = digits;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatCardNumber(raw: string) {
    const digits = raw.replace(/[^0-9]/g, '');
    return digits.replace(/(.{4})/g, '$1 ').trim() || '—';
  }

  function formatSheba(raw: string) {
    const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return s.replace(/(.{4})/g, '$1 ').trim() || '';
  }

  const [form, setForm] = useState({
    name: session?.name ?? '',
    phone: session?.phone ?? '',
    email: session?.email ?? '',
    province: 'تهران',
    city: '',
    address: '',
    postalCode: '',
    note: '',
    shippingMethodId: shippingMethods[0]?.id ?? '',
    paymentMethod: 'card',
    couponCode: '',
    cardRef: '',
    payerName: '',
    depositAt: '',
    cardLast4: ''
  });

  useEffect(() => {
    try {
      const c = localStorage.getItem('oilshop_coupon');
      if (c) setForm((f) => ({ ...f, couponCode: c }));
    } catch {
      /* ignore */
    }
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const [couponResult, setCouponResult] = useState<{ discount: number; freeShipping: boolean } | null>(null);

  useEffect(() => {
    if (!form.couponCode) {
      setCouponResult(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: form.couponCode, subtotal })
        });
        const d = await res.json();
        setCouponResult(res.ok && d.valid ? { discount: d.discount, freeShipping: d.freeShipping } : null);
      } catch {
        setCouponResult(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.couponCode, subtotal]);

  if (cart.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="mb-4 font-bold text-slate-800">سبد خرید شما خالی است</p>
        <Link href="/products" className="btn-primary">مشاهده محصولات</Link>
      </div>
    );
  }

  const method = shippingMethods.find((m) => m.id === form.shippingMethodId);
  const discount = couponResult?.discount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const freeShip =
    couponResult?.freeShipping ||
    (method?.price === 0) ||
    (method ? afterDiscount >= freeShippingThreshold : false);
  const shippingCost = freeShip ? 0 : (method?.price ?? 0);
  const total = afterDiscount + shippingCost;

  const validateStep = (): string | null => {
    if (step === 0) {
      if (form.name.trim().length < 2) return 'نام و نام خانوادگی را وارد کنید';
      if (!/^09\d{9}$/.test(form.phone)) return 'شماره موبایل معتبر وارد کنید (مثال: 09121234567)';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'ایمیل نامعتبر است';
    }
    if (step === 1) {
      if (!form.city.trim()) return 'شهر را وارد کنید';
      if (form.address.trim().length < 10) return 'آدرس کامل را وارد کنید (حداقل ۱۰ کاراکتر)';
      if (!form.shippingMethodId) return 'روش ارسال را انتخاب کنید';
    }
    return null;
  };

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, 2));
  }

  async function submit() {
    // اعتبارسنجی فرم پرداخت کارت به کارت
    if (form.payerName.trim().length < 2) {
      setError('نام و نام خانوادگی واریزکننده را وارد کنید');
      return;
    }
    if (!form.depositAt) {
      setError('ساعت و تاریخ واریز را وارد کنید');
      return;
    }
    if (!/^\d{4}$/.test(form.cardLast4)) {
      setError('۴ رقم آخر کارت واریزکننده را درست وارد کنید');
      return;
    }
    if (form.cardRef.trim().length < 2) {
      setError('شماره پیگیری را وارد کنید');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c.id, quantity: c.qty })),
          name: form.name,
          phone: form.phone,
          email: form.email,
          province: form.province,
          city: form.city,
          address: form.address,
          postalCode: form.postalCode,
          note: form.note,
          shippingMethodId: form.shippingMethodId,
          paymentMethod: 'card',
          cardRef: form.cardRef,
          payerName: form.payerName,
          depositAt: form.depositAt,
          cardLast4: form.cardLast4,
          couponCode: form.couponCode
        })
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? 'خطا در ثبت سفارش');
        setBusy(false);
        return;
      }
      clearCart();
      localStorage.removeItem('oilshop_coupon');
      router.push(`/checkout/success?order=${d.orderNumber}`);
    } catch {
      setError('خطا در برقراری ارتباط');
      setBusy(false);
    }
  }

  const steps = ['اطلاعات تماس', 'آدرس و ارسال', 'پرداخت'];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="card p-6">
        {/* Step indicator */}
        <ol className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-800 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i < step ? <IconCheck className="h-4 w-4" /> : new Intl.NumberFormat('fa-IR').format(i + 1)}
              </span>
              <span className={`hidden text-sm font-semibold sm:block ${i <= step ? 'text-slate-800' : 'text-slate-400'}`}>{s}</span>
              {i < steps.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
            </li>
          ))}
        </ol>

        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {step === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">نام و نام خانوادگی *</label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="مثلاً علی رضایی" />
            </div>
            <div>
              <label className="label">شماره موبایل *</label>
              <input className="input" dir="ltr" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09121234567" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">ایمیل (اختیاری)</label>
              <input className="input" dir="ltr" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">استان *</label>
              <select className="input" value={form.province} onChange={(e) => set('province', e.target.value)}>
                {IRANIAN_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">شهر *</label>
              <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="مثلاً تهران" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">آدرس کامل *</label>
              <textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="خیابان، کوچه، پلاک، واحد" />
            </div>
            <div>
              <label className="label">کد پستی</label>
              <input className="input" dir="ltr" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} placeholder="10 رقمی" />
            </div>
            <div>
              <label className="label">توضیحات سفارش (اختیاری)</label>
              <input className="input" value={form.note} onChange={(e) => set('note', e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <p className="label">روش ارسال *</p>
              <div className="space-y-2">
                {shippingMethods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm transition ${
                      form.shippingMethodId === m.id ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <input type="radio" name="shipping" className="h-4 w-4 accent-brand-700" checked={form.shippingMethodId === m.id} onChange={() => set('shippingMethodId', m.id)} />
                      <span>
                        <span className="block font-bold text-slate-800">{m.name}</span>
                        {m.description && <span className="text-xs text-slate-500">{m.description}</span>}
                        {m.estimatedDays && <span className="text-xs text-slate-500"> · {m.estimatedDays}</span>}
                      </span>
                    </span>
                    <span className="font-bold text-slate-800">
                      {m.price === 0 ? 'رایگان' : `${fmt.format(m.price)} ${currencyLabel}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="label">پرداخت کارت به کارت</p>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-emerald-900">مبلغ قابل پرداخت: {fmt.format(total)} {currencyLabel}</p>
                  <button
                    type="button"
                    onClick={copyCardNumber}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    {copied ? 'کپی شد ✓' : 'کپی شماره کارت'}
                  </button>
                </div>

                <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{cardSettings.bankName || 'بانک'}</span>
                    <span>{cardSettings.holderName || ''}</span>
                  </div>
                  <p className="mt-2 text-center text-xl font-black tracking-widest text-slate-800" dir="ltr">
                    {formatCardNumber(cardSettings.cardNumber)}
                  </p>
                  {cardSettings.sheba && (
                    <p className="mt-2 border-t border-slate-100 pt-2 text-center text-xs font-bold text-slate-500" dir="ltr">
                      {formatSheba(cardSettings.sheba)}
                    </p>
                  )}
                </div>

                {(cardSettings.receiptApp || cardSettings.receiptNumber) && (
                  <p className="mt-3 text-xs leading-6 text-emerald-800">
                    📎 فیش بانکی را از طریق {cardSettings.receiptApp || 'اپلیکیشن پیام‌رسان'} به شمارهٔ{' '}
                    <b dir="ltr">{cardSettings.receiptNumber || 'درج‌شده در سایت'}</b> ارسال کنید.
                  </p>
                )}

                {cardSettings.note && (
                  <p className="mt-3 text-xs leading-6 text-emerald-800">{cardSettings.note}</p>
                )}

                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-800">
                  ⚠️ توجه: نام و نام خانوادگی واریزکننده باید با صاحب حساب (کاربر) یکی باشد.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی واریزکننده *</label>
                  <input className="input mt-1 h-10 text-xs" value={form.payerName} onChange={(e) => set('payerName', e.target.value)} placeholder="مثلاً: علی رضایی" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">ساعت و تاریخ واریز *</label>
                  <input type="datetime-local" className="input mt-1 h-10 text-xs" dir="ltr" value={form.depositAt} onChange={(e) => set('depositAt', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">۴ رقم آخر کارت واریزکننده *</label>
                  <input className="input mt-1 h-10 text-xs" dir="ltr" maxLength={4} value={form.cardLast4} onChange={(e) => set('cardLast4', e.target.value.replace(/[^0-9]/g, ''))} placeholder="۱۲۳۴" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">شماره پیگیری *</label>
                  <input className="input mt-1 h-10 text-xs" dir="ltr" value={form.cardRef} onChange={(e) => set('cardRef', e.target.value)} placeholder="مثلاً: ۷۴۲۵۸۹۶۳" />
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                بعد از واریز، دکمهٔ «پرداخت کردم» را بزنید. سفارش شما پس از تأیید پرداخت توسط فروشگاه، ارسال می‌شود.
              </p>
            </div>

            <div>
              <label className="label">کد تخفیف</label>
              <input className="input" value={form.couponCode} onChange={(e) => set('couponCode', e.target.value.toUpperCase())} placeholder="WELCOME10" />
              {form.couponCode && couponResult && (
                <p className="mt-1.5 text-xs text-emerald-600">کد تخفیف اعمال شد (−{fmt.format(couponResult.discount)} {currencyLabel})</p>
              )}
              {form.couponCode && !couponResult && (
                <p className="mt-1.5 text-xs text-red-500">کد تخفیف معتبر نیست</p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="mb-1 font-bold text-slate-800">آدرس تحویل:</p>
              <p className="text-slate-600">{form.province}، {form.city} — {form.address}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-ghost">مرحله قبل</button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button onClick={next} className="btn-primary !px-8">ادامه</button>
          ) : (
            <button onClick={submit} disabled={busy} className="btn-primary !px-8">
              {busy ? 'در حال ثبت…' : 'پرداخت کردم'}
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="h-fit space-y-3 lg:sticky lg:top-32">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">سفارش شما ({fmt.format(cart.reduce((s, c) => s + c.qty, 0))} کالا)</h2>
          <ul className="space-y-3">
            {cart.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <img src={c.image} alt="" className="h-12 w-12 rounded-lg border border-slate-100 object-cover" />
                <span className="flex-1 truncate text-xs text-slate-600">{c.name}</span>
                <span className="text-xs font-bold text-slate-800">×{fmt.format(c.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">جمع کالاها</dt><dd className="font-semibold">{fmt.format(subtotal)} {currencyLabel}</dd></div>
            {discount > 0 && <div className="flex justify-between text-emerald-600"><dt>تخفیف</dt><dd>−{fmt.format(discount)} {currencyLabel}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-500">ارسال</dt><dd className="font-semibold">{freeShip ? <span className="text-emerald-600">رایگان</span> : `${fmt.format(shippingCost)} ${currencyLabel}`}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-3"><dt className="font-bold">قابل پرداخت</dt><dd className="font-black text-brand-800">{fmt.format(total)} {currencyLabel}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
