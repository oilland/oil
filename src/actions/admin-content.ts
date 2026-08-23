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

// ── Homepage sections ──────────────────────────────────────────
export async function saveHomepageSection(formData: FormData) {
  const session = await guard('content.manage');
  const id = str(formData.get('id'));
  const data = {
    title: str(formData.get('title')) || null,
    subtitle: str(formData.get('subtitle')) || null,
    enabled: formData.get('enabled') === 'on',
    sortOrder: Math.round(Number(formData.get('sortOrder')) || 0)
  };
  await prisma.homepageSection.update({ where: { id }, data });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'به‌روزرسانی بخش صفحه اصلی', entity: 'homepageSection', entityId: id });
  revalidatePath('/');
  redirectWithFlash('/admin/homepage', 'بخش صفحه اصلی ذخیره شد');
}

export async function moveHomepageSection(formData: FormData) {
  await guard('content.manage');
  const id = str(formData.get('id'));
  const dir = Number(formData.get('dir')) || 1;
  const sec = await prisma.homepageSection.findUnique({ where: { id } });
  if (!sec) return redirectWithFlash('/admin/homepage', 'بخش یافت نشد', true);
  const siblings = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } });
  const idx = siblings.findIndex((s) => s.id === id);
  const target = siblings[idx + (dir === 1 ? -1 : 1)];
  if (target) {
    await prisma.$transaction([
      prisma.homepageSection.update({ where: { id }, data: { sortOrder: target.sortOrder } }),
      prisma.homepageSection.update({ where: { id: target.id }, data: { sortOrder: sec.sortOrder } })
    ]);
  }
  revalidatePath('/');
  redirect('/admin/homepage');
}

// ── Testimonials ───────────────────────────────────────────────
export async function saveTestimonial(formData: FormData) {
  const session = await guard('content.manage');
  const id = str(formData.get('id'));
  const content = str(formData.get('content'));
  if (!content) return redirectWithFlash('/admin/testimonials', 'متن نظر الزامی است', true);
  const data = {
    name: str(formData.get('name')),
    role: str(formData.get('role')) || null,
    content,
    rating: Math.min(5, Math.max(1, Math.round(Number(formData.get('rating')) || 5))),
    isActive: formData.get('isActive') === 'on',
    sortOrder: Math.round(Number(formData.get('sortOrder')) || 0)
  };
  if (id) {
    await prisma.testimonial.update({ where: { id }, data });
  } else {
    await prisma.testimonial.create({ data });
  }
  await logActivity({ userId: session?.sub, adminName: session?.name, action: id ? 'ویرایش نظر مشتری' : 'افزودن نظر مشتری', entity: 'testimonial', entityId: id });
  revalidatePath('/');
  redirectWithFlash('/admin/testimonials', 'نظر ذخیره شد');
}

export async function deleteTestimonial(formData: FormData) {
  const session = await guard('content.manage');
  const id = str(formData.get('id'));
  await prisma.testimonial.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف نظر مشتری', entity: 'testimonial', entityId: id });
  revalidatePath('/');
  redirectWithFlash('/admin/testimonials', 'نظر حذف شد');
}

// ── FAQ ────────────────────────────────────────────────────────
export async function saveFaq(formData: FormData) {
  const session = await guard('content.manage');
  const id = str(formData.get('id'));
  const question = str(formData.get('question'));
  if (!question) return redirectWithFlash('/admin/faq', 'متن سوال الزامی است', true);
  const data = {
    question,
    answer: str(formData.get('answer')),
    isActive: formData.get('isActive') === 'on',
    sortOrder: Math.round(Number(formData.get('sortOrder')) || 0)
  };
  if (id) {
    await prisma.faq.update({ where: { id }, data });
  } else {
    await prisma.faq.create({ data });
  }
  await logActivity({ userId: session?.sub, adminName: session?.name, action: id ? 'ویرایش سوال متداول' : 'افزودن سوال متداول', entity: 'faq', entityId: id });
  redirectWithFlash('/admin/faq', 'سوال ذخیره شد');
}

export async function deleteFaq(formData: FormData) {
  const session = await guard('content.manage');
  const id = str(formData.get('id'));
  await prisma.faq.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف سوال متداول', entity: 'faq', entityId: id });
  redirectWithFlash('/admin/faq', 'سوال حذف شد');
}

// ── Shipping methods ───────────────────────────────────────────
export async function saveShippingMethod(formData: FormData) {
  const session = await guard('settings.manage');
  const id = str(formData.get('id'));
  const name = str(formData.get('name'));
  if (!name) return redirectWithFlash('/admin/shipping', 'نام روش ارسال الزامی است', true);
  const data = {
    name,
    description: str(formData.get('description')) || null,
    price: Math.round(Number(formData.get('price')) || 0),
    estimatedDays: str(formData.get('estimatedDays')) || null,
    freeThreshold: formData.get('freeThreshold') ? Math.round(Number(formData.get('freeThreshold'))) : null,
    isActive: formData.get('isActive') === 'on',
    sortOrder: Math.round(Number(formData.get('sortOrder')) || 0)
  };
  if (id) {
    await prisma.shippingMethod.update({ where: { id }, data });
  } else {
    await prisma.shippingMethod.create({ data });
  }
  await logActivity({ userId: session?.sub, adminName: session?.name, action: id ? 'ویرایش روش ارسال' : 'افزودن روش ارسال', entity: 'shippingMethod', entityId: id });
  revalidatePath('/checkout');
  redirectWithFlash('/admin/shipping', 'روش ارسال ذخیره شد');
}

export async function deleteShippingMethod(formData: FormData) {
  const session = await guard('settings.manage');
  const id = str(formData.get('id'));
  await prisma.shippingMethod.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف روش ارسال', entity: 'shippingMethod', entityId: id });
  revalidatePath('/checkout');
  redirectWithFlash('/admin/shipping', 'روش ارسال حذف شد');
}
