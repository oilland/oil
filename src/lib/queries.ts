import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { decodeSlug } from './slug';

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  salePrice: true,
  stock: true,
  averageRating: true,
  ratingCount: true,
  isBestSeller: true,
  brand: { select: { name: true } },
  category: { select: { name: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: 'asc' as const } }
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export async function getCategoryTree() {
  const cats = await prisma.category.findMany({
    where: { isActive: true, deletedAt: null, parentId: null },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      children: {
        where: { isActive: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, slug: true }
      }
    }
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    children: c.children.map((ch) => ({ id: ch.id, name: ch.name, slug: ch.slug, children: [] }))
  }));
}

export interface ProductQuery {
  q?: string;
  cat?: string;
  brand?: string;
  offer?: string;
  min?: string;
  max?: string;
  viscosity?: string;
  volume?: string;
  type?: string;
  inStock?: string;
  sort?: string;
  page?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleEngine?: string;
}

export async function queryProducts(input: ProductQuery) {
  const where: Prisma.ProductWhereInput = { isPublished: true, deletedAt: null };

  if (input.q) {
    where.OR = [
      { name: { contains: input.q } },
      { shortDescription: { contains: input.q } },
      { brand: { name: { contains: input.q } } }
    ];
  }

  if (input.cat) {
    const cat = await prisma.category.findUnique({ where: { slug: input.cat }, include: { children: true } });
    if (cat) {
      const ids = [cat.id, ...cat.children.map((c) => c.id)];
      where.categoryId = { in: ids };
    }
  }
  if (input.brand) where.brand = { slug: input.brand };
  if (input.offer === '1') where.salePrice = { not: null, lt: prisma.product.fields.price };
  if (input.inStock === '1') where.stock = { gt: 0 };
  if (input.min || input.max) {
    where.price = {
      ...(input.min ? { gte: Number(input.min) } : {}),
      ...(input.max ? { lte: Number(input.max) } : {})
    };
  }

  const specAnd: Prisma.ProductWhereInput[] = [];
  if (input.viscosity) specAnd.push({ specs: { some: { name: 'ویسکوزیته', value: input.viscosity } } });
  if (input.volume) specAnd.push({ specs: { some: { name: 'حجم', value: input.volume } } });
  if (input.type) specAnd.push({ specs: { some: { name: 'نوع روغن', value: input.type } } });
  if (specAnd.length) where.AND = specAnd;

  if (input.vehicleBrand || input.vehicleModel || input.vehicleYear || input.vehicleEngine) {
    const compatWhere: Prisma.ProductCompatibilityWhereInput = {};
    if (input.vehicleBrand) compatWhere.vehicleBrandId = input.vehicleBrand;
    if (input.vehicleModel) compatWhere.vehicleModelId = input.vehicleModel;
    if (input.vehicleYear) compatWhere.vehicleYearId = input.vehicleYear;
    if (input.vehicleEngine) compatWhere.vehicleEngineId = input.vehicleEngine;
    const compats = await prisma.productCompatibility.findMany({
      where: compatWhere,
      select: { productId: true }
    });
    where.id = { in: compats.map((c) => c.productId) };
  }

  // Prisma در حالت شیء تکی فقط یک فیلد orderBy قبول می‌کند.
  // sort=bestseller قبلاً دو فیلد در یک شیء می‌فرستاد و صفحه را در پروداکشن می‌ترکاند.
  const orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
    input.sort === 'price-asc'
      ? { price: 'asc' }
      : input.sort === 'price-desc'
        ? { price: 'desc' }
        : input.sort === 'rating'
          ? [{ averageRating: 'desc' }, { ratingCount: 'desc' }]
          : input.sort === 'bestseller'
            ? [{ isBestSeller: 'desc' }, { ratingCount: 'desc' }, { createdAt: 'desc' }]
            : { createdAt: 'desc' };

  const page = Math.max(1, Number(input.page) || 1);
  const perPage = 12;
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      select: productCardSelect,
      skip: (page - 1) * perPage,
      take: perPage
    }),
    prisma.product.count({ where })
  ]);

  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getFilterOptions() {
  const [categories, brands, specs] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, deletedAt: null, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, slug: true }
        }
      }
    }),
    prisma.brand.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.productSpec.findMany({ where: { product: { isPublished: true } }, select: { name: true, value: true } })
  ]);
  const uniq = (name: string) => {
    const set = new Set<string>();
    specs.forEach((s) => {
      if (s.name === name && s.value) set.add(s.value);
    });
    return Array.from(set);
  };
  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      children: c.children.map((ch) => ({ id: ch.id, name: ch.name, slug: ch.slug, children: [] }))
    })),
    brands,
    viscosity: uniq('ویسکوزیته'),
    volume: uniq('حجم'),
    type: uniq('نوع روغن')
  };
}

export async function getProductBySlug(slug: string) {
  const decoded = decodeSlug(slug);
  return prisma.product.findFirst({
    where: { slug: decoded, isPublished: true, deletedAt: null },
    include: {
      brand: true,
      category: true,
      images: { orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }] },
      specs: { orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }] },
      reviews: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      },
      compatibilities: {
        include: { vehicleBrand: true, vehicleModel: true, vehicleYear: true, vehicleEngine: true },
        take: 50
      }
    }
  });
}

export async function getRelatedProducts(product: {
  id: string;
  categoryId: string | null;
  brandId: string | null;
}) {
  const list = await prisma.product.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      id: { not: product.id },
      OR: [{ categoryId: product.categoryId }, { brandId: product.brandId }]
    },
    orderBy: { averageRating: 'desc' },
    take: 4,
    select: productCardSelect
  });
  if (list.length >= 4) return list;
  const extra = await prisma.product.findMany({
    where: { isPublished: true, deletedAt: null, id: { not: product.id } },
    orderBy: { createdAt: 'desc' },
    take: 4 - list.length,
    select: productCardSelect
  });
  return [...list, ...extra];
}
