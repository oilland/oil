// ─────────────────────────────────────────────────────────────
//  Domain constants — statuses, permissions, options
// ─────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  { value: 'pending', label: 'در انتظار پرداخت', color: 'bg-amber-100 text-amber-800' },
  { value: 'paid', label: 'پرداخت شده', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'در حال پردازش', color: 'bg-violet-100 text-violet-800' },
  { value: 'packed', label: 'بسته‌بندی شده', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'shipped', label: 'ارسال شده', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'delivered', label: 'تحویل شده', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'لغو شده', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'مرجوع شده', color: 'bg-slate-200 text-slate-700' }
] as const;

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'در انتظار', color: 'bg-amber-100 text-amber-800' },
  { value: 'paid', label: 'پرداخت شده', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'failed', label: 'ناموفق', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'مسترد شده', color: 'bg-slate-200 text-slate-700' }
] as const;

export const COUPON_TYPES = [
  { value: 'percent', label: 'درصدی' },
  { value: 'fixed', label: 'مبلغ ثابت' },
  { value: 'free_shipping', label: 'ارسال رایگان' }
] as const;

export const REVIEW_STATUSES = [
  { value: 'pending', label: 'در انتظار تایید', color: 'bg-amber-100 text-amber-800' },
  { value: 'approved', label: 'تایید شده', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'rejected', label: 'رد شده', color: 'bg-red-100 text-red-800' }
] as const;

export const PERMISSIONS: { group: string; items: { slug: string; label: string }[] }[] = [
  {
    group: 'داشبورد',
    items: [{ slug: 'dashboard.view', label: 'مشاهده داشبورد' }]
  },
  {
    group: 'محصولات',
    items: [
      { slug: 'products.view', label: 'مشاهده محصولات' },
      { slug: 'products.create', label: 'ایجاد محصول' },
      { slug: 'products.edit', label: 'ویرایش محصول' },
      { slug: 'products.delete', label: 'حذف محصول' },
      { slug: 'vehicles.manage', label: 'مدیریت سازگاری خودرو' }
    ]
  },
  {
    group: 'دسته‌بندی و برند',
    items: [
      { slug: 'categories.manage', label: 'مدیریت دسته‌بندی‌ها' },
      { slug: 'brands.manage', label: 'مدیریت برندها' }
    ]
  },
  {
    group: 'سفارشات و مشتریان',
    items: [
      { slug: 'orders.view', label: 'مشاهده سفارشات' },
      { slug: 'orders.edit', label: 'ویرایش سفارشات' },
      { slug: 'customers.view', label: 'مشاهده مشتریان' },
      { slug: 'customers.edit', label: 'ویرایش مشتریان' }
    ]
  },
  {
    group: 'بازاریابی',
    items: [
      { slug: 'coupons.manage', label: 'مدیریت کد تخفیف' },
      { slug: 'banners.manage', label: 'مدیریت بنرها' }
    ]
  },
  {
    group: 'محتوا',
    items: [
      { slug: 'blog.manage', label: 'مدیریت وبلاگ' },
      { slug: 'content.manage', label: 'مدیریت صفحات و محتوا' },
      { slug: 'reviews.moderate', label: 'مدیریت دیدگاه‌ها' }
    ]
  },
  {
    group: 'سیستم',
    items: [
      { slug: 'settings.manage', label: 'مدیریت تنظیمات' },
      { slug: 'roles.manage', label: 'مدیریت نقش‌ها' },
      { slug: 'activity.view', label: 'مشاهده گزارش فعالیت' }
    ]
  }
];

export const ALL_PERMISSION_SLUGS = PERMISSIONS.flatMap((g) => g.items.map((i) => i.slug));

export const IRANIAN_PROVINCES = [
  'تهران', 'البرز', 'اصفهان', 'فارس', 'خراسان رضوی', 'خراسان شمالی', 'خراسان جنوبی',
  'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'ایلام', 'بوشهر', 'چهارمحال و بختیاری',
  'خوزستان', 'زنجان', 'سمنان', 'سیستان و بلوچستان', 'قزوین', 'قم', 'کردستان', 'کرمان',
  'کرمانشاه', 'کهگیلویه و بویراحمد', 'گلستان', 'گیلان', 'لرستان', 'مازندران', 'مرکزی',
  'هرمزگان', 'همدان', 'یزد'
];
