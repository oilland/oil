'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { loginSchema, registerSchema } from '@/lib/validators';
import { hashPassword, verifyPassword } from '@/lib/session';
import { setSessionCookie, clearSession, getSession } from '@/lib/session';
import { logActivity } from '@/lib/activity';
import { redirectWithFlash } from '@/lib/flash';

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });
  if (!parsed.success) return redirectWithFlash('/login', parsed.error.issues[0].message, true);

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { role: { include: { permissions: { include: { permission: true } } } } }
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return redirectWithFlash('/login', 'ایمیل یا رمز عبور اشتباه است', true);
  }
  if (!user.isActive) {
    return redirectWithFlash('/login', 'حساب کاربری شما غیرفعال شده است', true);
  }

  const roleSlug = user.role?.slug ?? 'CUSTOMER';
  const perms = user.role?.permissions.map((p) => p.permission.slug) ?? [];

  await setSessionCookie({ sub: user.id, name: user.name, role: roleSlug, perms });

  const next = String(formData.get('next') || '');
  if (roleSlug === 'SUPER_ADMIN' || roleSlug === 'ADMIN') {
    redirect('/admin');
  }
  redirect(next && next.startsWith('/') ? next : '/account');
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password')
  });
  if (!parsed.success) return redirectWithFlash('/register', parsed.error.issues[0].message, true);

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (exists) return redirectWithFlash('/register', 'این ایمیل قبلاً ثبت شده است', true);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password)
    }
  });

  await logActivity({ userId: user.id, action: 'ثبت‌نام', entity: 'user', entityId: user.id });
  await setSessionCookie({ sub: user.id, name: user.name, role: 'CUSTOMER', perms: [] });
  redirect('/account');
}

export async function logoutAction() {
  await clearSession();
  redirect('/');
}

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  if (name.length < 2) return redirectWithFlash('/account/profile', 'نام را وارد کنید', true);
  if (phone && !/^09\d{9}$/.test(phone)) return redirectWithFlash('/account/profile', 'شماره موبایل معتبر نیست', true);

  await prisma.user.update({
    where: { id: session.sub },
    data: { name, phone: phone || null }
  });
  return redirectWithFlash('/account/profile', 'اطلاعات شما به‌روزرسانی شد');
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const current = String(formData.get('current') || '');
  const next = String(formData.get('next') || '');

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return redirectWithFlash('/account/profile', 'رمز عبور فعلی اشتباه است', true);
  }
  if (next.length < 6) return redirectWithFlash('/account/profile', 'رمز جدید حداقل ۶ کاراکتر باشد', true);

  await prisma.user.update({ where: { id: session.sub }, data: { passwordHash: await hashPassword(next) } });
  return redirectWithFlash('/account/profile', 'رمز عبور تغییر کرد');
}
