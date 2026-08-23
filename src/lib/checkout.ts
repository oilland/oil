import { prisma } from './db';
import { validateCoupon } from './coupons';

export async function computeOrder(input: {
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  shippingMethodId: string;
  userId?: string | null;
}) {
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
    select: {
      id: true,
      name: true,
      price: true,
      salePrice: true,
      stock: true,
      sku: true,
      images: { select: { url: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 }
    }
  });
  const map = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  const missing: string[] = [];
  for (const it of input.items) {
    const p = map.get(it.productId);
    if (!p) {
      missing.push(it.productId);
      continue;
    }
    lines.push({ product: p, quantity: Math.min(it.quantity, 99) });
  }

  const subtotal = lines.reduce((s, l) => s + (l.product.salePrice ?? l.product.price) * l.quantity, 0);

  const shippingMethod = await prisma.shippingMethod.findUnique({ where: { id: input.shippingMethodId } });
  let shippingCost = shippingMethod?.price ?? 0;

  const coupon = input.couponCode
    ? await validateCoupon(input.couponCode, subtotal, input.userId)
    : null;
  const discount = coupon?.valid ? coupon.discount : 0;

  const freeShipping =
    (coupon?.valid && coupon.freeShipping) ||
    (shippingMethod?.freeThreshold ? subtotal - discount >= shippingMethod.freeThreshold : false);
  if (freeShipping) shippingCost = 0;

  const total = Math.max(0, subtotal - discount) + shippingCost;

  return {
    lines,
    missing,
    subtotal,
    discount,
    shippingCost,
    total,
    freeShipping,
    couponCode: coupon?.valid ? coupon.code : null
  };
}
