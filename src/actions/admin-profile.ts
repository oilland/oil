'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hashPassword, verifyPassword, setSessionCookie, clearSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';
import { redirectWithFlash } from '@/lib/flash';

const str = (v: FormDataEntryValue | null) => (v ? String(v).trim() : '');

async function guardAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') redirect('/');
  return session;
}

// تغییر نام + ایمیل مدیر فعلی
export async function updateAdminProfile(formData: FormData) {
  const session = await guardAdmin();
  const name = str(formData.get('name'));
  const email = str(formData.get('email')).toLowerCase();

  if (name.length < 2) return redirectWithFlash('/admin/profile', 'نام را وارد کنید', true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return redirectWithFlash('/admin/profile', 'ایمیل معتبر وارد کنید', true);

  const dup = await prisma.user.findFirst({ where: { email, id: { not: session.sub } } });
  if (dup) return redirectWithFlash('/admin/profile', 'این ایمیل قبلاً استفاده شده است', true);

  await prisma.user.update({ where: { id: session.sub }, data: { name, email } });
  await logActivity({ userId: session.sub, adminName: name, action: 'به‌روزرسانی پروفایل مدیر', entity: 'user', entityId: session.sub });

  // update the session name too
  await setSessionCookie({ sub: session.sub, name, role: session.role, perms: session.perms });
  return redirectWithFlash('/admin/profile', 'پروفایل به‌روزرسانی شد');
}

// تغییر رمز مدیر فعلی
export async function changeAdminPassword(formData: FormData) {
  const session = await guardAdmin();
  const current = str(formData.get('current'));
  const next = str(formData.get('next'));
  const confirm = str(formData.get('confirm'));

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return redirectWithFlash('/admin/profile', 'رمز عبور فعلی اشتباه است', true);
  }
  if (next.length < 6) return redirectWithFlash('/admin/profile', 'رمز جدید حداقل ۶ کاراکتر باشد', true);
  if (next !== confirm) return redirectWithFlash('/admin/profile', 'تکرار رمز جدید مطابقت ندارد', true);

  await prisma.user.update({ where: { id: session.sub }, data: { passwordHash: await hashPassword(next) } });
  await logActivity({ userId: session.sub, adminName: session.name, action: 'تغییر رمز عبور', entity: 'user', entityId: session.sub });

  // بعد از تغییر رمز، همهٔ نشست‌ها را باطل کن تا دوباره با رمز جدید وارد شود
  await clearSession();
  redirect('/admin/login');
}
