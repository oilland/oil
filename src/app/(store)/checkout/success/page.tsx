import Link from 'next/link';
import { IconCheck } from '@/components/icons';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { prisma } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();

  let total = 0;
  if (sp.order) {
    const order = await prisma.order.findFirst({ where: { orderNumber: sp.order }, select: { total: true } });
    if (order) total = order.total;
  }
  const settings = await getSettings();

  const fmtSheba = (raw: string) => {
    const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return s.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="container-x section">
      <div className="mx-auto max-w-lg">
        <div className="card p-10 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <IconCheck className="h-8 w-8" />
          </span>
          <h1 className="mb-2 text-xl font-extrabold text-slate-900">سفارش شما با موفقیت ثبت شد</h1>
          <p className="mb-1 text-sm text-slate-500">شماره سفارش:</p>
          <p className="mb-6 text-lg font-black text-brand-800" dir="ltr">{sp.order ?? ''}</p>

          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-right">
            <p className="mb-1 text-sm font-extrabold text-emerald-900">مبلغ قابل پرداخت:</p>
            <p className="mb-4 text-lg font-black text-emerald-800">{formatPrice(total)}</p>
            {settings.cardNumber && (
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{settings.cardBankName || 'بانک'}</span>
                  <span>{settings.cardHolderName || ''}</span>
                </div>
                <p className="mt-2 text-center text-xl font-black tracking-widest text-slate-800" dir="ltr">
                  {settings.cardNumber.replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim()}
                </p>
                {settings.cardSheba && (
                  <p className="mt-2 border-t border-slate-100 pt-2 text-center text-xs font-bold text-slate-500" dir="ltr">
                    {fmtSheba(settings.cardSheba)}
                  </p>
                )}
              </div>
            )}
            {(settings.receiptApp || settings.receiptNumber) && (
              <p className="mt-3 text-xs leading-6 text-emerald-800">
                📎 فیش بانکی را از طریق {settings.receiptApp || 'اپلیکیشن پیام‌رسان'} به شمارهٔ{' '}
                <b dir="ltr">{settings.receiptNumber || 'درج‌شده در سایت'}</b> ارسال کنید.
              </p>
            )}
          </div>

          <p className="mb-8 text-sm leading-7 text-slate-500">
            پرداخت شما ثبت شد و در انتظار تأیید فروشگاه است.
            پس از تأیید، سفارش شما آماده و ارسال می‌شود.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {session ? (
              <Link href="/account/orders" className="btn-primary">پیگیری سفارش</Link>
            ) : (
              <Link href="/account/orders" className="btn-outline">ورود برای پیگیری</Link>
            )}
            <Link href="/products" className="btn-ghost">ادامه خرید</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
