'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { uniqueSlug } from '@/lib/slug';
import { logActivity } from '@/lib/activity';
import { redirectWithFlash } from '@/lib/flash';

async function guard() {
  const session = await getSession();
  if (!hasPermission(session, 'vehicles.manage') && !hasPermission(session, 'products.edit')) redirect('/admin');
  return session;
}
const str = (v: FormDataEntryValue | null) => (v ? String(v).trim() : '');

// ── Vehicle brands ─────────────────────────────────────────────
export async function saveVehicleBrand(formData: FormData) {
  const session = await guard();
  const id = str(formData.get('id'));
  const name = str(formData.get('name'));
  if (!name) return redirectWithFlash('/admin/vehicles', 'نام برند خودرو الزامی است', true);

  if (id) {
    await prisma.vehicleBrand.update({ where: { id }, data: { name } });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'ویرایش برند خودرو', entity: 'vehicleBrand', entityId: id, newValue: name });
  } else {
    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.vehicleBrand.findUnique({ where: { slug: s } })));
    await prisma.vehicleBrand.create({ data: { name, slug } });
    await logActivity({ userId: session?.sub, adminName: session?.name, action: 'افزودن برند خودرو', entity: 'vehicleBrand', newValue: name });
  }
  redirectWithFlash('/admin/vehicles', 'برند خودرو ذخیره شد');
}

export async function deleteVehicleBrand(formData: FormData) {
  const session = await guard();
  const id = str(formData.get('id'));
  await prisma.vehicleBrand.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف برند خودرو', entity: 'vehicleBrand', entityId: id });
  redirectWithFlash('/admin/vehicles', 'برند خودرو (و مدل‌های آن) حذف شد');
}

// ── Vehicle models (with years + engines) ──────────────────────
export async function saveVehicleModel(formData: FormData) {
  const session = await guard();
  const id = str(formData.get('id'));
  const brandId = str(formData.get('brandId'));
  const name = str(formData.get('name'));
  if (!brandId) return redirectWithFlash('/admin/vehicles?tab=models', 'برند خودرو را انتخاب کنید', true);
  if (!name) return redirectWithFlash('/admin/vehicles?tab=models', 'نام مدل الزامی است', true);

  const yearsRaw = str(formData.get('years'));
  const years = yearsRaw
    .split(/[\s,،٬]+/)
    .map((y) => parseInt(y.trim(), 10))
    .filter((y) => Number.isFinite(y) && y > 1300 && y < 1500);

  const engines = str(formData.get('engines'))
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  let model;
  if (id) {
    model = await prisma.vehicleModel.update({ where: { id }, data: { name, brandId } });
    await prisma.vehicleYear.deleteMany({ where: { modelId: id } });
    await prisma.vehicleEngine.deleteMany({ where: { modelId: id } });
  } else {
    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.vehicleModel.findFirst({ where: { slug: s } })));
    model = await prisma.vehicleModel.create({ data: { name, slug, brandId } });
  }

  if (years.length) {
    await prisma.vehicleYear.createMany({ data: years.map((year) => ({ modelId: model.id, year })) });
  }
  if (engines.length) {
    await prisma.vehicleEngine.createMany({ data: engines.map((e) => ({ modelId: model.id, name: e })) });
  }

  await logActivity({ userId: session?.sub, adminName: session?.name, action: id ? 'ویرایش مدل خودرو' : 'افزودن مدل خودرو', entity: 'vehicleModel', entityId: model.id, newValue: name });
  revalidatePath('/');
  redirectWithFlash('/admin/vehicles?tab=models', 'مدل خودرو ذخیره شد');
}

export async function deleteVehicleModel(formData: FormData) {
  const session = await guard();
  const id = str(formData.get('id'));
  await prisma.vehicleModel.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف مدل خودرو', entity: 'vehicleModel', entityId: id });
  redirectWithFlash('/admin/vehicles?tab=models', 'مدل خودرو (و سال‌ها/موتورهای آن) حذف شد');
}

// ── Product ↔ vehicle compatibility ────────────────────────────
export async function addVehicleCompatibility(formData: FormData) {
  const session = await guard();
  const productId = str(formData.get('productId'));
  const vehicleBrandId = str(formData.get('vehicleBrandId'));
  const vehicleModelId = str(formData.get('vehicleModelId'));
  const vehicleYearId = str(formData.get('vehicleYearId'));
  const vehicleEngineId = str(formData.get('vehicleEngineId'));

  if (!productId) return redirectWithFlash('/admin/vehicles?tab=compat', 'محصول را انتخاب کنید', true);
  if (!vehicleBrandId) return redirectWithFlash('/admin/vehicles?tab=compat', 'برند خودرو را انتخاب کنید', true);

  const dup = await prisma.productCompatibility.findFirst({
    where: {
      productId,
      vehicleBrandId,
      vehicleModelId: vehicleModelId || null,
      vehicleYearId: vehicleYearId || null,
      vehicleEngineId: vehicleEngineId || null
    }
  });
  if (dup) return redirectWithFlash('/admin/vehicles?tab=compat', 'این سازگاری قبلاً ثبت شده است', true);

  await prisma.productCompatibility.create({
    data: {
      productId,
      vehicleBrandId,
      vehicleModelId: vehicleModelId || null,
      vehicleYearId: vehicleYearId || null,
      vehicleEngineId: vehicleEngineId || null
    }
  });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'افزودن سازگاری خودرو', entity: 'productCompatibility', newValue: `${productId} → ${vehicleModelId}` });
  revalidatePath('/');
  redirectWithFlash('/admin/vehicles?tab=compat', 'سازگاری ثبت شد');
}

export async function deleteVehicleCompatibility(formData: FormData) {
  const session = await guard();
  const id = str(formData.get('id'));
  await prisma.productCompatibility.delete({ where: { id } });
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'حذف سازگاری خودرو', entity: 'productCompatibility', entityId: id });
  revalidatePath('/');
  redirectWithFlash('/admin/vehicles?tab=compat', 'سازگاری حذف شد');
}
