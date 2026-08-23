import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatPrice, formatDateTime } from '@/lib/format';
import { updateOrderStatus, approvePayment, addTracking, addNote, refundOrder } from '@/actions/admin-order';
import { StatusPill, Flash } from '@/components/ui';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/constants';
import { PrintButton } from '@/components/admin/PrintButton';
import { IconArrowRight } from '@/components/icons';

export const metadata = { title: 'جزئیات سفارش' };

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ flash?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: true, shippingMethod: true, payments: true }
  });
  if (!order) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="btn-ghost h-10 !px-2" aria-label="بازگشت"><IconArrowRight className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900" dir="ltr">{order.orderNumber}</h1>
            <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill value={order.status} items={ORDER_STATUSES} />
          <PrintButton />
        </div>
      </div>

      <Flash searchParams={sp} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Items */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 p-5"><h2 className="text-sm font-extrabold text-slate-900">اقلام سفارش</h2></div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="w-16 p-3">{it.image && <img src={it.image} alt="" className="h-11 w-11 rounded-lg border border-slate-100 object-cover" />}</td>
                    <td className="p-3 font-medium text-slate-800">{it.name}</td>
                    <td className="p-3 text-xs text-slate-400">{formatPrice(it.price)} × {new Intl.NumberFormat('fa-IR').format(it.quantity)}</td>
                    <td className="p-3 font-bold text-slate-800">{formatPrice(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-6 border-t border-slate-100 p-4 text-sm">
              <span className="text-slate-500">جمع کالاها: <b className="text-slate-800">{formatPrice(order.subtotal)}</b></span>
              {order.discount > 0 && <span className="text-emerald-600">تخفیف: <b>−{formatPrice(order.discount)}</b></span>}
              <span className="text-slate-500">ارسال: <b className="text-slate-800">{order.shippingCost === 0 ? 'رایگان' : formatPrice(order.shippingCost)}</b></span>
              <span className="font-black text-brand-800">قابل پرداخت: {formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Status management */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-extrabold text-slate-900">تغییر وضعیت سفارش</h2>
              <form action={updateOrderStatus} className="flex gap-2">
                <input type="hidden" name="id" value={order.id} />
                <select name="status" defaultValue={order.status} className="input h-10">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary h-10 shrink-0">ثبت</button>
              </form>
            </div>
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-extrabold text-slate-900">کد رهگیری مرسوله</h2>
              <form action={addTracking} className="flex gap-2">
                <input type="hidden" name="id" value={order.id} />
                <input name="trackingCode" defaultValue={order.trackingCode ?? ''} placeholder="کد رهگیری" dir="ltr" className="input h-10" />
                <button type="submit" className="btn-outline h-10 shrink-0">ذخیره</button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold text-slate-900">اطلاعات مشتری</h2>
            <dl className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><dt className="text-slate-500">نام</dt><dd className="font-semibold">{order.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">موبایل</dt><dd className="font-semibold" dir="ltr">{order.phone}</dd></div>
              {order.email && <div className="flex justify-between"><dt className="text-slate-500">ایمیل</dt><dd className="font-semibold" dir="ltr">{order.email}</dd></div>}
              {order.user && (
                <div className="flex justify-between"><dt className="text-slate-500">حساب کاربری</dt><dd><Link href="/admin/customers" className="font-semibold text-brand-700">{order.user.name}</Link></dd></div>
              )}
            </dl>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-6 text-slate-500">
              {order.province}، {order.city} — {order.address}
              {order.postalCode && <span dir="ltr"> ({order.postalCode})</span>}
            </p>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold text-slate-900">پرداخت</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">روش پرداخت</span>
              <span className="font-semibold">
                {order.paymentMethod === 'card' ? 'کارت به کارت' : order.paymentMethod === 'cod' ? 'پرداخت در محل' : 'پرداخت آنلاین'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">وضعیت</span>
              <StatusPill value={order.paymentStatus} items={PAYMENT_STATUSES} />
            </div>
            {order.payments.map((p) => {
              let meta: { payerName?: string | null; depositAt?: string | null; cardLast4?: string | null } | null = null;
              try {
                meta = p.metadata ? JSON.parse(p.metadata) : null;
              } catch {
                meta = null;
              }
              return (
                <div key={p.id} className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                  <p>درگاه: {p.gateway === 'card' ? 'کارت به کارت' : p.gateway} · مبلغ: {formatPrice(p.amount)}</p>
                  {meta?.payerName && <p className="mt-1">واریزکننده: <b className="text-slate-700">{meta.payerName}</b></p>}
                  {meta?.depositAt && <p className="mt-1" dir="ltr">تاریخ و ساعت واریز: {meta.depositAt.replace('T', ' ')}</p>}
                  {meta?.cardLast4 && <p className="mt-1" dir="ltr">۴ رقم آخر کارت واریزکننده: {meta.cardLast4}</p>}
                  {p.referenceCode && (
                    <p className="mt-1 font-semibold text-slate-700" dir="ltr">شماره پیگیری: {p.referenceCode}</p>
                  )}
                </div>
              );
            })}
            {order.paymentStatus === 'pending' && order.status !== 'refunded' && order.status !== 'cancelled' && (
              <form action={approvePayment} className="mt-3">
                <input type="hidden" name="id" value={order.id} />
                <button type="submit" className="btn-primary h-10 w-full">تأیید پرداخت</button>
              </form>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold text-slate-900">یادداشت داخلی</h2>
            <form action={addNote} className="space-y-2">
              <input type="hidden" name="id" value={order.id} />
              <textarea name="note" rows={3} defaultValue={order.internalNotes ?? ''} className="input resize-none" placeholder="یادداشت برای تیم داخلی…" />
              <button type="submit" className="btn-outline h-10">ذخیره یادداشت</button>
            </form>
          </div>

          {order.status !== 'refunded' && order.status !== 'cancelled' && (
            <form action={refundOrder}>
              <input type="hidden" name="id" value={order.id} />
              <button type="submit" className="btn-danger w-full">مرجوع کردن سفارش</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
