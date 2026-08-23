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

// ── Coupons ─────────────────────────────────────────────────
export async function saveCoupon(formData: FormData) {
  const session = await guard('coupons.manage');
  const id = str(formData.get('id'));
  const code = str(formData.get('code')).toUpperCase();
  if (code.length < 2) return redirectWithFlash('/admin/coupons', 'کد تخفیف الزامی است', true);

  const dup = await prisma.coupon.findFirst({ where: { code, id: id ? { not: id } : undefined } });
  if (dup) return redirectWithFlash('/admin/coupons', 'این کد قبلاً ثبت شده است', true);

  const numOrNull = (v: string) => (v === '' ? null : Math.round(Number(v) || 0));
  const dateOrNull = (v: string) => (v === '' ? null : new Date(v));

  const data = {
    code,
    type: str(formData.get('type')) || 'percent',
    value: Math.round(Number(formData.get('value')) || 0),
    minOrder: numOrNull(str(formData.get('minOrder'))),
    maxDiscount: numOrNull(str(formData.get('maxDiscount'))),
    startDate: dateOrNull(str(formData.get('startDate'))),
    endDate: dateOrNull(str(formData.get('endDate'))),
    usageLimit: numOrNull(str(formData.get('usageLimit'))),
    perUserLimit: Math.round(Number(formData.get('perUserLimit')) || 1),
    firstOrderOnly: formData.get('firstOrderOnly') === 'on',
    isActive: formData.get('isActive') === 'on'
  };

  if (id) {
    await prisma.coupon.update({ where: { id }, data });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ویرایش کد تخفیف', entity: 'coupon', entityId: id, newValue: code });
  } else {
    const c = await prisma.coupon.create({ data });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ایجاد کد تخفیف', entity: 'coupon', entityId: c.id, newValue: code });
  }
  redirectWithFlash('/admin/coupons', 'کد تخفیف ذخیره شد');
}

export async function deleteCoupon(formData: FormData) {
  const session = await guard('coupons.manage');
  const id = str(formData.get('id'));
  await prisma.coupon.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف کد تخفیف', entity: 'coupon', entityId: id });
  redirectWithFlash('/admin/coupons', 'کد تخفیف حذف شد');
}

// ── Banners ─────────────────────────────────────────────────
export async function saveBanner(formData: FormData) {
  const session = await guard('banners.manage');
  const id = str(formData.get('id'));
  const image = str(formData.get('image'));

  // برای بنر جدید تصویر الزامی است؛ برای ویرایش، اگر تصویر ارسال نشد تصویر قبلی حفظ می‌شود
  if (!id && !image) return redirectWithFlash('/admin/banners', 'تصویر بنر الزامی است', true);
  if (id && !image) {
    const existing = await prisma.banner.findUnique({ where: { id }, select: { image: true } });
    if (!existing?.image) return redirectWithFlash('/admin/banners', 'تصویر بنر الزامی است', true);
  }

  const data = {
    title: str(formData.get('title')) || null,
    subtitle: str(formData.get('subtitle')) || null,
    buttonText: str(formData.get('buttonText')) || null,
    url: str(formData.get('url')) || null,
    mobileImage: str(formData.get('mobileImage')) || null,
    section: str(formData.get('section')) || 'hero',
    sortOrder: Math.round(Number(formData.get('sortOrder')) || 0),
    isActive: formData.get('isActive') === 'on'
  };

  if (id) {
    await prisma.banner.update({ where: { id }, data: { ...data, ...(image ? { image } : {}) } });
  } else {
    await prisma.banner.create({ data: { ...data, image } });
  }
  await logActivity({ userId: session?.sub, adminName: session?.name, action: id ? 'ویرایش بنر' : 'ایجاد بنر', entity: 'banner', entityId: id, newValue: data.title ?? image });
  revalidatePath('/');
  redirectWithFlash('/admin/banners', 'بنر ذخیره شد');
}

export async function deleteBanner(formData: FormData) {
  const session = await guard('banners.manage');
  const id = str(formData.get('id'));
  await prisma.banner.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف بنر', entity: 'banner', entityId: id });
  revalidatePath('/');
  redirectWithFlash('/admin/banners', 'بنر حذف شد');
}

// ── Blog ────────────────────────────────────────────────────
export async function saveBlogPost(formData: FormData) {
  const session = await guard('blog.manage');
  const id = str(formData.get('id'));
  const title = str(formData.get('title'));
  if (title.length < 2) return redirectWithFlash('/admin/blog', 'عنوان مقاله الزامی است', true);

  const data = {
    title,
    excerpt: str(formData.get('excerpt')) || null,
    content: str(formData.get('content')) || '',
    coverImage: str(formData.get('coverImage')) || null,
    categoryId: str(formData.get('categoryId')) || null,
    tags: str(formData.get('tags')) || null,
    status: str(formData.get('status')) === 'published' ? 'published' : 'draft',
    seoTitle: str(formData.get('seoTitle')) || null,
    seoDescription: str(formData.get('seoDescription')) || null
  };

  if (id) {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.status === 'published' && (!post?.publishedAt) ? new Date() : post?.publishedAt
      }
    });
  } else {
    const slug = await uniqueSlug(title, async (s) => Boolean(await prisma.blogPost.findUnique({ where: { slug: s } })));
    await prisma.blogPost.create({
      data: { ...data, slug, publishedAt: data.status === 'published' ? new Date() : null }
    });
  }
  await logActivity({ userId: session?.sub, adminName: session?.name, action: id ? 'ویرایش مقاله' : 'ایجاد مقاله', entity: 'blogPost', entityId: id, newValue: title });
  revalidatePath('/');
  revalidatePath('/blog');
  redirectWithFlash('/admin/blog', 'مقاله ذخیره شد');
}

export async function deleteBlogPost(formData: FormData) {
  const session = await guard('blog.manage');
  const id = str(formData.get('id'));
  await prisma.blogPost.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف مقاله', entity: 'blogPost', entityId: id });
  revalidatePath('/');
  revalidatePath('/blog');
  redirectWithFlash('/admin/blog', 'مقاله حذف شد');
}

// ── CMS pages ───────────────────────────────────────────────
export async function savePage(formData: FormData) {
  const session = await guard('content.manage');
  const id = str(formData.get('id'));
  const title = str(formData.get('title'));
  if (!title) return redirectWithFlash('/admin/pages', 'عنوان صفحه الزامی است', true);

  const data = {
    title,
    content: str(formData.get('content')) || '',
    seoTitle: str(formData.get('seoTitle')) || null,
    seoDescription: str(formData.get('seoDescription')) || null
  };

  if (id) {
    await prisma.page.update({ where: { id }, data });
  } else {
    const slug = await uniqueSlug(title, async (s) => Boolean(await prisma.page.findUnique({ where: { slug: s } })));
    await prisma.page.create({ data: { ...data, slug, isSystem: false } });
  }
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ذخیره صفحه', entity: 'page', entityId: id, newValue: title });
  redirectWithFlash('/admin/pages', 'صفحه ذخیره شد');
}
