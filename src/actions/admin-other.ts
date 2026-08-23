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

export async function toggleCustomer(formData: FormData) {
  const session = await guard('customers.edit');
  const id = str(formData.get('id'));
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return redirectWithFlash('/admin/customers', 'مشتری یافت نشد', true);
  await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: user.isActive ? 'غیرفعال‌سازی مشتری' : 'فعال‌سازی مشتری', entity: 'user', entityId: id });
  revalidatePath('/admin/customers');
  redirectWithFlash('/admin/customers', 'وضعیت مشتری تغییر کرد');
}

export async function moderateReview(formData: FormData) {
  const session = await guard('reviews.moderate');
  const id = str(formData.get('id'));
  const status = str(formData.get('status'));
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return redirectWithFlash('/admin/reviews', 'دیدگاه یافت نشد', true);
  await prisma.review.update({ where: { id }, data: { status } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'تغییر وضعیت دیدگاه', entity: 'review', entityId: id, newValue: status });
  revalidatePath('/');
  revalidatePath('/admin/reviews');
  redirectWithFlash('/admin/reviews', 'وضعیت دیدگاه تغییر کرد');
}

export async function deleteReview(formData: FormData) {
  const session = await guard('reviews.moderate');
  const id = str(formData.get('id'));
  await prisma.review.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف دیدگاه', entity: 'review', entityId: id });
  revalidatePath('/admin/reviews');
  redirectWithFlash('/admin/reviews', 'دیدگاه حذف شد');
}

export async function saveRolePermissions(formData: FormData) {
  const session = await guard('roles.manage');
  const roleId = str(formData.get('roleId'));
  const perms = str(formData.get('permissions')).split(',').filter(Boolean);
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: perms.map((permissionId) => ({ roleId, permissionId }))
    })
  ]);
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'به‌روزرسانی دسترسی نقش', entity: 'role', entityId: roleId });
  redirectWithFlash('/admin/roles', 'دسترسی‌های نقش به‌روزرسانی شد');
}
