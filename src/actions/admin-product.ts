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
const num = (v: FormDataEntryValue | null, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
};

export async function saveProduct(formData: FormData) {
  const session = await guard('products.create');
  const id = str(formData.get('id'));

  const name = str(formData.get('name'));
  if (name.length < 2) return redirectWithFlash('/admin/products', 'نام محصول الزامی است', true);

  const salePriceRaw = str(formData.get('salePrice'));
  const salePrice = salePriceRaw === '' ? null : num(formData.get('salePrice'));

  let specs: { group: string; name: string; value: string }[] = [];
  try {
    specs = JSON.parse(str(formData.get('specs')) || '[]');
  } catch {
    specs = [];
  }
  const images = str(formData.get('images'))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const data = {
    name,
    shortDescription: str(formData.get('shortDescription')) || null,
    description: str(formData.get('description')) || null,
    brandId: str(formData.get('brandId')) || null,
    categoryId: str(formData.get('categoryId')) || null,
    price: num(formData.get('price')),
    salePrice,
    sku: str(formData.get('sku')) || null,
    barcode: str(formData.get('barcode')) || null,
    stock: num(formData.get('stock')),
    lowStockThreshold: num(formData.get('lowStockThreshold'), 5),
    isPublished: formData.get('isPublished') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isBestSeller: formData.get('isBestSeller') === 'on',
    seoTitle: str(formData.get('seoTitle')) || null,
    seoDescription: str(formData.get('seoDescription')) || null
  };

  let product;
  if (id) {
    product = await prisma.product.update({ where: { id }, data });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ویرایش محصول', entity: 'product', entityId: id, newValue: name });
  } else {
    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.product.findUnique({ where: { slug: s } })));
    product = await prisma.product.create({ data: { ...data, slug } });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ایجاد محصول', entity: 'product', entityId: product.id, newValue: name });
  }

  if (images.length > 0) {
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: images.map((url, i) => {
        let fileName: string | null = null;
        try {
          fileName = decodeURIComponent(url.split('/').pop() || '') || null;
        } catch {
          fileName = url.split('/').pop() || null;
        }
        return { productId: product.id, url, alt: name, fileName, sortOrder: i, isMain: i === 0 };
      })
    });
  }
  if (specs.length > 0) {
    await prisma.productSpec.deleteMany({ where: { productId: product.id } });
    await prisma.productSpec.createMany({
      data: specs
        .filter((s) => s.name && s.value)
        .map((s, i) => ({ productId: product.id, group: s.group || 'عمومی', name: s.name, value: s.value, sortOrder: i }))
    });
  }

  revalidatePath('/');
  revalidatePath('/products');
  redirectWithFlash('/admin/products', 'محصول با موفقیت ذخیره شد');
}

export async function deleteProduct(formData: FormData) {
  const session = await guard('products.delete');
  const id = str(formData.get('id'));
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف محصول', entity: 'product', entityId: id });
  revalidatePath('/');
  revalidatePath('/products');
  redirectWithFlash('/admin/products', 'محصول حذف شد');
}

export async function bulkProductAction(formData: FormData) {
  const session = await guard('products.edit');
  const ids = str(formData.get('ids')).split(',').filter(Boolean);
  const action = str(formData.get('action'));
  if (ids.length === 0) return redirectWithFlash('/admin/products', 'محصولی انتخاب نشده است', true);

  if (action === 'publish') {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isPublished: true } });
  } else if (action === 'unpublish') {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isPublished: false } });
  } else if (action === 'delete') {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  } else if (action === 'feature') {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isFeatured: true } });
  } else {
    return redirectWithFlash('/admin/products', 'عملیات نامعتبر است', true);
  }

  await logActivity({ userId: session?.sub, adminName: session?.name, action: `عملیات گروهی (${action})`, entity: 'product', newValue: `${ids.length} محصول` });
  revalidatePath('/');
  revalidatePath('/products');
  redirectWithFlash('/admin/products', 'عملیات گروهی انجام شد');
}
