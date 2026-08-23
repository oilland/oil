import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(1, 'رمز عبور را وارد کنید')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'نام را وارد کنید'),
  email: z.string().email('ایمیل معتبر وارد کنید'),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر وارد کنید (مثال: 09121234567)'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر باشد')
});

export const checkoutSchema = z.object({
  name: z.string().min(2, 'نام و نام خانوادگی الزامی است'),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر وارد کنید'),
  email: z.string().email('ایمیل معتبر وارد کنید').or(z.literal('')),
  province: z.string().min(1, 'استان را انتخاب کنید'),
  city: z.string().min(2, 'شهر را وارد کنید'),
  address: z.string().min(10, 'آدرس کامل را وارد کنید'),
  postalCode: z.string().optional(),
  note: z.string().optional(),
  shippingMethodId: z.string().min(1),
  paymentMethod: z.string().min(1),
  cardRef: z.string().optional(),
  payerName: z.string().optional(),
  depositAt: z.string().optional(),
  cardLast4: z.string().optional(),
  couponCode: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(99) })).min(1)
});

export const productSchema = z.object({
  name: z.string().min(2, 'نام محصول الزامی است'),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.coerce.number().int().min(0, 'قیمت نامعتبر است'),
  salePrice: z.coerce.number().int().min(0).optional().or(z.literal('')),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z.string().optional(), // comma separated urls
  specs: z.string().optional() // JSON array of {group,name,value}
});

export const categorySchema = z.object({
  name: z.string().min(1, 'نام دسته‌بندی الزامی است'),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().optional()
});

export const brandSchema = z.object({
  name: z.string().min(1, 'نام برند الزامی است'),
  slug: z.string().optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export const couponSchema = z.object({
  code: z.string().min(2, 'کد تخفیف الزامی است'),
  type: z.enum(['percent', 'fixed', 'free_shipping']),
  value: z.coerce.number().int().min(0).default(0),
  minOrder: z.coerce.number().int().min(0).optional().or(z.literal('')),
  maxDiscount: z.coerce.number().int().min(0).optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.coerce.number().int().min(1).optional().or(z.literal('')),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  firstOrderOnly: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const bannerSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  buttonText: z.string().optional(),
  url: z.string().optional(),
  image: z.string().min(1, 'تصویر بنر الزامی است'),
  section: z.string().default('hero'),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().optional()
});

export const blogPostSchema = z.object({
  title: z.string().min(2, 'عنوان الزامی است'),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional()
});

export const reviewSchema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(3, 'متن دیدگاه را وارد کنید')
});
