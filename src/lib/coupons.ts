import { prisma } from './db';
import { formatPrice } from './format';

export type CouponResult = {
  valid: boolean;
  code?: string;
  discount: number;
  freeShipping: boolean;
  message: string;
};

export async function validateCoupon(
  code: string,
  subtotal: number,
  userId?: string | null
): Promise<CouponResult> {
  const invalid = (message: string): CouponResult => ({ valid: false, discount: 0, freeShipping: false, message });
  const normalized = code.trim().toUpperCase();
  if (!normalized) return invalid('کد تخفیف را وارد کنید');

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) return invalid('کد تخفیف نامعتبر است');
  if (!coupon.isActive) return invalid('کد تخفیف غیرفعال است');

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) return invalid('کد تخفیف هنوز فعال نشده است');
  if (coupon.endDate && now > coupon.endDate) return invalid('کد تخفیف منقضی شده است');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return invalid('ظرفیت استفاده از این کد تکمیل شده است');
  if (coupon.minOrder && subtotal < coupon.minOrder)
    return invalid(`حداقل مبلغ سفارش برای این کد ${formatPrice(coupon.minOrder)} است`);

  if (coupon.firstOrderOnly && userId) {
    const count = await prisma.order.count({ where: { userId } });
    if (count > 0) return invalid('این کد فقط برای اولین سفارش قابل استفاده است');
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.floor((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, subtotal);
  }
  const freeShipping = coupon.type === 'free_shipping' || coupon.freeShipping;

  return {
    valid: true,
    code: coupon.code,
    discount,
    freeShipping,
    message: freeShipping ? 'کد تخفیف و ارسال رایگان اعمال شد' : 'کد تخفیف اعمال شد'
  };
}
