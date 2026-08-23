'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';
import { redirectWithFlash } from '@/lib/flash';

async function guard(perm: string) {
  const session = await getSession();
  if (!hasPermission(session, perm)) redirect('/admin');
  return session;
}
const str = (v: FormDataEntryValue | null) => (v ? String(v).trim() : '');

export async function updateOrderStatus(formData: FormData) {
  const session = await guard('orders.edit');
  const id = str(formData.get('id'));
  const status = str(formData.get('status'));
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return redirectWithFlash('/admin/orders', 'سفارش یافت نشد', true);

  await prisma.order.update({
    where: { id },
    data: {
      status,
      paymentStatus: status === 'paid' && order.paymentStatus === 'pending' ? 'paid' : order.paymentStatus
    }
  });
  await logActivity({
    userId: session?.sub,
    adminName: session?.name,
    action: 'تغییر وضعیت سفارش',
    entity: 'order',
    entityId: id,
    oldValue: order.status,
    newValue: status
  });
  revalidatePath('/admin/orders');
  redirectWithFlash(`/admin/orders/${id}`, 'وضعیت سفارش به‌روزرسانی شد');
}

export async function approvePayment(formData: FormData) {
  const session = await guard('orders.edit');
  const id = str(formData.get('id'));
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return redirectWithFlash('/admin/orders', 'سفارش یافت نشد', true);

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'paid',
        status: order.status === 'pending' ? 'processing' : order.status
      }
    }),
    prisma.payment.updateMany({
      where: { orderId: id, status: 'pending' },
      data: { status: 'paid' }
    })
  ]);

  await logActivity({
    userId: session?.sub,
    adminName: session?.name,
    action: 'تأیید پرداخت',
    entity: 'order',
    entityId: id,
    oldValue: order.paymentStatus,
    newValue: 'paid'
  });
  revalidatePath('/admin/orders');
  redirectWithFlash(`/admin/orders/${id}`, 'پرداخت تأیید شد');
}

export async function addTracking(formData: FormData) {
  const session = await guard('orders.edit');
  const id = str(formData.get('id'));
  const trackingCode = str(formData.get('trackingCode'));
  if (!trackingCode) return redirectWithFlash(`/admin/orders/${id}`, 'کد رهگیری را وارد کنید', true);
  await prisma.order.update({ where: { id }, data: { trackingCode } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ثبت کد رهگیری', entity: 'order', entityId: id, newValue: trackingCode });
  revalidatePath('/admin/orders');
  redirectWithFlash(`/admin/orders/${id}`, 'کد رهگیری ثبت شد');
}

export async function addNote(formData: FormData) {
  const session = await guard('orders.edit');
  const id = str(formData.get('id'));
  const note = str(formData.get('note'));
  await prisma.order.update({ where: { id }, data: { internalNotes: note || null } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'یادداشت داخلی سفارش', entity: 'order', entityId: id });
  redirectWithFlash(`/admin/orders/${id}`, 'یادداشت ذخیره شد');
}

export async function refundOrder(formData: FormData) {
  const session = await guard('orders.edit');
  const id = str(formData.get('id'));
  await prisma.order.update({ where: { id }, data: { status: 'refunded', paymentStatus: 'refunded' } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'مرجوع کردن سفارش', entity: 'order', entityId: id });
  revalidatePath('/admin/orders');
  redirectWithFlash(`/admin/orders/${id}`, 'سفارش مرجوع شد');
}
