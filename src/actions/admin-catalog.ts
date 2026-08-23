'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { uniqueSlug } from '@/lib/slug';
import { logActivity } from '@/lib/activity';
import { redirectWithFlash } from '@/lib/flash';

async function guard(perm: string) {
  const session = await getSession();
  if (!hasPermission(session, perm)) redirect('/admin');
  return session;
}
const str = (v: FormDataEntryValue | null) => (v ? String(v).trim() : '');

// ── Categories ──────────────────────────────────────────────
export async function saveCategory(formData: FormData) {
  const session = await guard('categories.manage');
  const id = str(formData.get('id'));
  const name = str(formData.get('name'));
  if (!name) return redirectWithFlash('/admin/categories', 'نام دسته‌بندی الزامی است', true);

  const data = {
    name,
    description: str(formData.get('description')) || null,
    image: str(formData.get('image')) || null,
    parentId: str(formData.get('parentId')) || null,
    sortOrder: Number(formData.get('sortOrder')) || 0,
    isActive: formData.get('isActive') === 'on'
  };

  if (id) {
    await prisma.category.update({ where: { id }, data });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ویرایش دسته‌بندی', entity: 'category', entityId: id, newValue: name });
  } else {
    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.category.findUnique({ where: { slug: s } })));
    const cat = await prisma.category.create({ data: { ...data, slug } });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ایجاد دسته‌بندی', entity: 'category', entityId: cat.id, newValue: name });
  }
  revalidatePath('/');
  revalidatePath('/products');
  redirectWithFlash('/admin/categories', 'دسته‌بندی ذخیره شد');
}

export async function deleteCategory(formData: FormData) {
  const session = await guard('categories.manage');
  const id = str(formData.get('id'));
  await prisma.category.updateMany({ where: { OR: [{ id }, { parentId: id }] }, data: { deletedAt: new Date() } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف دسته‌بندی', entity: 'category', entityId: id });
  revalidatePath('/');
  redirectWithFlash('/admin/categories', 'دسته‌بندی حذف شد');
}

export async function moveCategory(formData: FormData) {
  await guard('categories.manage');
  const id = str(formData.get('id'));
  const dir = Number(formData.get('dir')) || 1;
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return redirectWithFlash('/admin/categories', 'دسته‌بندی یافت نشد', true);

  const siblings = await prisma.category.findMany({
    where: { parentId: cat.parentId, deletedAt: null },
    orderBy: { sortOrder: 'asc' }
  });
  const idx = siblings.findIndex((s) => s.id === id);
  const target = siblings[idx + (dir === 1 ? -1 : 1)];
  if (target) {
    await prisma.$transaction([
      prisma.category.update({ where: { id }, data: { sortOrder: target.sortOrder } }),
      prisma.category.update({ where: { id: target.id }, data: { sortOrder: cat.sortOrder } })
    ]);
  }
  revalidatePath('/');
  redirect('/admin/categories');
}

// ── Brands ──────────────────────────────────────────────────
export async function saveBrand(formData: FormData) {
  const session = await guard('brands.manage');
  const id = str(formData.get('id'));
  const name = str(formData.get('name'));
  if (!name) return redirectWithFlash('/admin/brands', 'نام برند الزامی است', true);

  const data = {
    name,
    logo: str(formData.get('logo')) || null,
    description: str(formData.get('description')) || null,
    isActive: formData.get('isActive') === 'on'
  };

  if (id) {
    await prisma.brand.update({ where: { id }, data });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ویرایش برند', entity: 'brand', entityId: id, newValue: name });
  } else {
    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.brand.findUnique({ where: { slug: s } })));
    const b = await prisma.brand.create({ data: { ...data, slug } });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ایجاد برند', entity: 'brand', entityId: b.id, newValue: name });
  }
  revalidatePath('/');
  revalidatePath('/products');
  redirectWithFlash('/admin/brands', 'برند ذخیره شد');
}

export async function deleteBrand(formData: FormData) {
  const session = await guard('brands.manage');
  const id = str(formData.get('id'));
  await prisma.brand.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف برند', entity: 'brand', entityId: id });
  revalidatePath('/');
  redirectWithFlash('/admin/brands', 'برند حذف شد');
}
