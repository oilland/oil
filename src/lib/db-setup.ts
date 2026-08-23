// ─────────────────────────────────────────────────────────────────────────────
//  Self-contained DB bootstrap — runs INSIDE the app (no CLI, no console).
//  1) creates tables from the embedded migration SQL
//  2) seeds the full Behran catalog (176 products) from embedded data
//  Fully idempotent: safe to run on every boot. Works on any platform.
// ─────────────────────────────────────────────────────────────────────────────
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { ALL_PERMISSION_SLUGS } from './constants';
import { uniqueSlug } from './slug';
import { MIGRATION_SQL } from './migration-sql';
import { INDUSTRIAL, MOTOR } from './seed-data';

// ── Categories ───────────────────────────────────────────────────────────────
const PARENT_CATS = [
  { slug: 'industrial-oils', name: 'روغن‌های صنعتی', desc: 'روغن‌ها و روانکارهای صنعتی شرکت نفت بهران', sort: 1 },
  { slug: 'automotive-fluids', name: 'روانکارهای خودرویی', desc: 'روغن گیربکس و روانکارهای خودرو', sort: 2 },
  { slug: 'agricultural-lubricants', name: 'روانکارهای ماشین‌آلات کشاورزی', desc: 'روغن تراکتور و ماشین‌آلات برون‌جاده‌ای', sort: 3 },
  { slug: 'engine-oil', name: 'روغن موتور', desc: 'روغن موتور بنزینی و دیزلی شرکت نفت بهران', sort: 4 }
];
const CHILD_CATS: { slug: string; name: string; parent: string; sort: number }[] = [
  { slug: 'turbine-oils', name: 'روغن‌های توربین', parent: 'industrial-oils', sort: 1 },
  { slug: 'hydraulic-oils', name: 'روغن‌های هیدرولیک', parent: 'industrial-oils', sort: 2 },
  { slug: 'industrial-gear-oils', name: 'روغن‌های دنده صنعتی', parent: 'industrial-oils', sort: 3 },
  { slug: 'compressor-oils', name: 'روغن‌های کمپرسور', parent: 'industrial-oils', sort: 4 },
  { slug: 'refrigeration-oils', name: 'روغن‌های کمپرسور برودتی', parent: 'industrial-oils', sort: 5 },
  { slug: 'heat-transfer-oils', name: 'روغن‌های انتقال حرارت', parent: 'industrial-oils', sort: 6 },
  { slug: 'heat-treatment-oils', name: 'روغن‌های عملیات حرارتی و آبکاری', parent: 'industrial-oils', sort: 7 },
  { slug: 'metalworking-oils', name: 'روغن‌های فلزکاری و برش', parent: 'industrial-oils', sort: 8 },
  { slug: 'textile-oils', name: 'روغن‌های نساجی', parent: 'industrial-oils', sort: 9 },
  { slug: 'rust-preventives', name: 'روغن‌های ضدزنگ و محافظ', parent: 'industrial-oils', sort: 10 },
  { slug: 'transformer-oils', name: 'روغن‌های ترانسفورماتور', parent: 'industrial-oils', sort: 11 },
  { slug: 'general-purpose', name: 'روغن‌های مصارف عمومی', parent: 'industrial-oils', sort: 12 },
  { slug: 'gear-oils', name: 'روغن گیربکس دنده‌ای', parent: 'automotive-fluids', sort: 1 },
  { slug: 'atf', name: 'روغن گیربکس اتوماتیک (ATF)', parent: 'automotive-fluids', sort: 2 },
  { slug: 'tractor-oils', name: 'روغن‌های تراکتور و برون‌جاده‌ای', parent: 'agricultural-lubricants', sort: 1 },
  { slug: 'engine-oil-gasoline', name: 'روغن موتور بنزینی', parent: 'engine-oil', sort: 1 },
  { slug: 'engine-oil-diesel', name: 'روغن موتور دیزلی', parent: 'engine-oil', sort: 2 }
];

const FAMILY_CAT: Record<string, string> = {
  'بهران توربین': 'turbine-oils', 'بهران درفش': 'industrial-gear-oils', 'بهران هیدرولیک': 'hydraulic-oils',
  'بهران بردبار': 'industrial-gear-oils', 'بهران گردان UTTO': 'tractor-oils', 'بهران گردان ویژه 56': 'tractor-oils',
  'بهران برش': 'metalworking-oils', 'بهران تراش': 'metalworking-oils', 'بهران مقاوم': 'metalworking-oils',
  'بهران بافت': 'textile-oils', 'بهران دوخت': 'textile-oils', 'بهران حرارت': 'heat-transfer-oils',
  'بهران آبکار': 'heat-treatment-oils', 'بهران آبکار ویژه': 'heat-treatment-oils', 'بهران آبکار گرم': 'heat-treatment-oils',
  'بهران کمپرسور': 'compressor-oils', 'بهران سرد ویژه': 'refrigeration-oils', 'بهران مته': 'metalworking-oils',
  'بهران پاک': 'general-purpose', 'بهران محافظ': 'rust-preventives', 'بهران آذرخش ویژه': 'transformer-oils',
  'بهران سمند': 'gear-oils', 'بهران سمند ویژه': 'gear-oils', 'بهران اتوماتیک': 'atf'
};

const DESC: Record<string, string> = {
  'بهران توربین': 'روغن توربین بهران با روغن پایه معدنی مرغوب و افزودنی‌های ضد اکسیداسیون و ضد زنگ برای روانکاری توربین‌های بخار، گاز و آب و سیستم‌های گردشی طراحی شده است.',
  'بهران درفش': 'روغن دنده صنعتی بهران درفش با خواص ضد سایش و تحمل بار بالا برای روانکاری گیربکس‌های صنعتی طراحی شده است.',
  'بهران هیدرولیک': 'روغن هیدرولیک بهران با پایداری حرارتی و خواص ضد سایش مناسب برای روانکاری سیستم‌های هیدرولیک صنعتی طراحی شده است.',
  'بهران بردبار': 'روغن دنده صنعتی سنگین بهران بردبار برای روانکاری چرخ‌دنده‌های صنعتی در شرایط بار و فشار بالا طراحی شده است.',
  'بهران گردان': 'روغن چندمنظوره بهران گردان برای روانکاری سیستم انتقال نیرو، کلاچ، ترمز مرطوب و هیدرولیک تراکتورها و ماشین‌آلات کشاورزی طراحی شده است.',
  'بهران برش': 'روغن برشکاری بهران برای روانکاری و خنک‌کاری عملیات برش و ماشین‌کاری فلزات طراحی شده است.',
  'بهران تراش': 'روغن تراشکاری بهران برای روانکاری و خنک‌کاری عملیات ماشین‌کاری دقیق فلزات مناسب است.',
  'بهران مقاوم': 'روغن بهران مقاوم برای روانکاری مته‌های سنگ‌بری، ماشین‌آلات معدن و تجهیزات دارای بار ضربه‌ای بالا طراحی شده است.',
  'بهران بافت': 'روغن نساجی بهران بافت برای روانکاری ماشین‌آلات بافندگی و ریسندگی طراحی شده است.',
  'بهران دوخت': 'روغن بهران دوخت برای روانکاری ماشین‌آلات دوخت صنعتی و تجهیزات نساجی مناسب است.',
  'بهران حرارت': 'روغن انتقال حرارت بهران برای سیستم‌های گرمایش غیرمستقیم صنعتی با پایداری حرارتی بالا طراحی شده است.',
  'بهران آبکار': 'روغن آبکار بهران برای عملیات حرارتی فلزات و فرآیندهای آبکاری و سخت‌کاری طراحی شده است.',
  'بهران کمپرسور': 'روغن کمپرسور بهران برای روانکاری کمپرسورهای هوا با پایداری اکسیداسیون مناسب طراحی شده است.',
  'بهران سرد ویژه': 'روغن کمپرسور برودتی بهران سرد ویژه برای روانکاری کمپرسورهای سیستم‌های تبرید طراحی شده است.',
  'بهران مته': 'روغن بهران مته برای روانکاری مته‌ها و ابزارهای حفاری و ماشین‌کاری طراحی شده است.',
  'بهران پاک': 'روغن پاک‌کننده بهران برای تمیزکاری و شست‌وشوی قطعات و تجهیزات صنعتی مناسب است.',
  'بهران محافظ': 'روغن ضدزنگ و محافظ بهران برای محافظت موقت قطعات فلزی در برابر خوردگی طراحی شده است.',
  'بهران آذرخش ویژه': 'روغن الکتریکال بهران آذرخش ویژه برای عایق‌کاری و خنک‌کاری ترانسفورماتورها طراحی شده است.',
  'بهران سمند': 'روغن گیربکس دنده‌ای بهران سمند برای روانکاری گیربکس‌های دستی و دیفرانسیل خودروهای سبک طراحی شده است.',
  'بهران اتوماتیک': 'روغن گیربکس اتوماتیک (ATF) بهران برای روانکاری گیربکس‌های اتوماتیک خودرو طراحی شده است.'
};

const MOTOR_DESC: Record<string, string> = {
  'بندر توربو': 'روغن موتور دیزلی تک‌درجه‌ای (SAE 50) برای موتورهای دیزلی سنگین سوپرشارژ و توربوشارژ.',
  'توربو لاین': 'روغن موتور دیزلی چنددرجه‌ای برای موتورهای دیزلی سنگین با عملکرد بالا.',
  'توربو دیزل': 'روغن موتور دیزلی برای کامیون‌ها و اتوبوس‌ها با پایداری حرارتی مناسب.',
  'سوپر توربو ران': 'روغن موتور دیزلی با کیفیت بالا برای اتوبوس‌ها و کامیون‌های مجهز به EGR.',
  'اکسترا توربو دیزل': 'روغن موتور دیزلی ممتاز برای اتوبوس‌ها و کامیون‌های جدید با قلیائیت بالا.',
  'توربو E5': 'روغن موتور دیزلی با استاندارد آلایندگی E5 مناسب خودروهای دیزلی مدرن.',
  'تکتاز': 'روغن موتور بنزینی اقتصادی با کیفیت مناسب برای خودروهای داخلی.',
  'پیشتاز': 'روغن موتور بنزینی چنددرجه‌ای با کیفیت مناسب برای خودروهای سواری.',
  'رانا': 'روغن موتور بنزینی پرفروش برای خودروهای داخلی با پایداری حرارتی مناسب.',
  'اولترا رانا': 'روغن موتور بنزینی تمام سنتتیک ممتاز برای خودروهای جدید.'
};
const motorDesc = (name: string) => {
  for (const [k, d] of Object.entries(MOTOR_DESC)) if (name.includes(k)) return d;
  return 'روغن موتور شرکت نفت بهران با کیفیت و استانداردهای روز.';
};

const MOTOR_SIZE: Record<string, string> = {
  'سطل ۲۰ لیتری پلاستیکی': '۲۰ لیتری', 'بشکه ۲۰۸ لیتری': '۲۰۸ لیتری', 'گالن فلزی': 'گالن فلزی',
  'کوارت فلزی': 'کوارت فلزی', 'سه و نیم لیتری پلاستیکی': 'سه و نیم لیتری', '۱ لیتری پلاستیکی': '۱ لیتری',
  '۴ لیتری پلاستیکی': '۴ لیتری', '۵ لیتری پلاستیکی': '۵ لیتری'
};

// ── Setup ─────────────────────────────────────────────────────────────────────
async function tablesExist(): Promise<boolean> {
  try {
    const r = await prisma.$queryRawUnsafe<{ t: string | null }[]>(
      `SELECT to_regclass('public."User"')::text AS t`
    );
    return r[0]?.t !== null;
  } catch {
    return false;
  }
}

async function createTables() {
  const statements = MIGRATION_SQL
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((l) => !l.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((s) => s.length > 0);
  console.log(`[db-setup] اجرای ${statements.length} دستور SQL…`);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log('[db-setup] ✅ جدول‌ها ساخته شدند');
}

async function seed() {
  const users = await prisma.user.count();
  if (users > 0) {
    console.log('[db-setup] دیتابیس قبلاً seed شده — رد شد');
    return;
  }

  // permissions & roles
  const permIds: Record<string, string> = {};
  for (const slug of ALL_PERMISSION_SLUGS) {
    const p = await prisma.permission.create({ data: { name: slug, slug, group: 'app' } });
    permIds[slug] = p.id;
  }
  const roleDefs = [
    { name: 'مدیر کل', slug: 'SUPER_ADMIN', desc: 'دسترسی کامل', perms: ALL_PERMISSION_SLUGS },
    { name: 'مدیر', slug: 'ADMIN', desc: 'مدیریت کامل فروشگاه', perms: ALL_PERMISSION_SLUGS },
    { name: 'مدیر محصول', slug: 'PRODUCT_MANAGER', desc: 'مدیریت محصولات', perms: ['dashboard.view', 'products.view', 'products.create', 'products.edit', 'products.delete', 'categories.manage', 'brands.manage', 'vehicles.manage'] },
    { name: 'مدیر سفارش', slug: 'ORDER_MANAGER', desc: 'مدیریت سفارشات', perms: ['dashboard.view', 'orders.view', 'orders.edit', 'customers.view', 'customers.edit'] },
    { name: 'مدیر محتوا', slug: 'CONTENT_MANAGER', desc: 'مدیریت محتوا', perms: ['dashboard.view', 'blog.manage', 'banners.manage', 'content.manage'] },
    { name: 'پشتیبانی', slug: 'SUPPORT', desc: 'پاسخگویی به مشتریان', perms: ['dashboard.view', 'orders.view', 'customers.view', 'reviews.moderate'] }
  ];
  for (const r of roleDefs) {
    const role = await prisma.role.create({ data: { name: r.name, slug: r.slug, description: r.desc, isSystem: true } });
    for (const slug of r.perms) if (permIds[slug]) await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permIds[slug] } });
  }

  // users
  const adminRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  await prisma.user.create({ data: { email: 'admin@example.com', name: 'مدیر ارشد', passwordHash: await bcrypt.hash('admin123', 10), roleId: adminRole!.id, isActive: true } });
  await prisma.user.create({ data: { email: 'customer@example.com', name: 'علی رضایی', phone: '09121234567', passwordHash: await bcrypt.hash('customer123', 10), roleId: adminRole!.id, isActive: true } });

  // categories
  const parentIds: Record<string, string> = {};
  for (const p of PARENT_CATS) {
    const c = await prisma.category.create({ data: { name: p.name, slug: p.slug, description: p.desc, sortOrder: p.sort, image: `/images/categories/${p.slug}.svg` } });
    parentIds[p.slug] = c.id;
  }
  const catIds: Record<string, string> = {};
  for (const ch of CHILD_CATS) {
    const c = await prisma.category.create({ data: { name: ch.name, slug: ch.slug, parentId: parentIds[ch.parent], sortOrder: ch.sort, image: `/images/categories/${ch.slug}.svg` } });
    catIds[ch.slug] = c.id;
  }

  // brand
  const brand = await prisma.brand.create({
    data: { name: 'نفت بهران', slug: 'behran', logo: '/images/behran/logo.webp', description: 'شرکت نفت بهران، بزرگ‌ترین تولیدکننده روغن‌های موتور و صنعتی در ایران با بیش از ۶۰ سال تجربه.' }
  });

  const exists = (slug: string) => prisma.product.findUnique({ where: { slug } });
  const createProduct = async (input: {
    name: string; slug: string; desc: string; catSlug: string; price: number; sku: string | null;
    packaging: string; grade: string; specs: { group: string; name: string; value: string }[];
    featured?: boolean; bestseller?: boolean;
  }) => {
    const product = await prisma.product.create({
      data: {
        name: input.name, slug: input.slug,
        shortDescription: `${input.desc} این محصول در گرید ${input.grade} و بسته‌بندی ${input.packaging} عرضه می‌شود.`,
        description: input.desc,
        brandId: brand.id, categoryId: catIds[input.catSlug],
        price: input.price, salePrice: null, sku: input.sku,
        stock: 100, lowStockThreshold: 5, isPublished: true,
        isFeatured: input.featured ?? false, isBestSeller: input.bestseller ?? false,
        seoTitle: input.name, seoDescription: input.desc
      }
    });
    for (let i = 0; i < input.specs.length; i++) {
      await prisma.productSpec.create({ data: { productId: product.id, ...input.specs[i], sortOrder: i } });
    }
    await prisma.productImage.create({
      data: { productId: product.id, url: `/images/products/branded/${input.slug}.svg`, alt: `${input.name}`, sortOrder: 0, isMain: true, matchLevel: 'branded', fileName: `${input.slug}.svg` }
    });
  };

  // industrial
  const groupCount: Record<string, number> = {};
  for (const r of INDUSTRIAL) {
    const n = r.grade ? `${r.name} ${r.grade}` : r.name;
    groupCount[n] = (groupCount[n] ?? 0) + 1;
  }
  for (const r of INDUSTRIAL) {
    const full = r.grade ? `${r.name} ${r.grade}` : r.name;
    const name = groupCount[full] > 1 ? `${full} ${r.packaging}` : full;
    const desc = DESC[r.name] ?? 'روانکار صنعتی شرکت نفت بهران.';
    const slug = await uniqueSlug(name, async (s) => Boolean(await exists(s)));
    await createProduct({
      name, slug, desc, catSlug: FAMILY_CAT[r.name] ?? 'general-purpose',
      price: Math.round(r.price / 10), sku: r.code, packaging: r.packaging, grade: r.grade,
      specs: [{ group: 'مشخصات', name: 'گرید', value: r.grade }, { group: 'مشخصات', name: 'نوع بسته‌بندی', value: r.packaging }]
    });
  }
  // motor
  for (const r of MOTOR) {
    const size = MOTOR_SIZE[r.packaging] ?? r.packaging;
    const name = `${r.name} ${size}`;
    const slug = await uniqueSlug(name, async (s) => Boolean(await exists(s)));
    await createProduct({
      name, slug, desc: motorDesc(r.name), catSlug: r.category === 'دیزلی' ? 'engine-oil-diesel' : 'engine-oil-gasoline',
      price: Math.round(r.consumer / 10), sku: r.code, packaging: r.packaging, grade: r.grade,
      specs: [
        { group: 'مشخصات فنی', name: 'گرید', value: r.grade },
        { group: 'مشخصات فنی', name: 'نوع بسته‌بندی', value: r.packaging },
        { group: 'مشخصات فنی', name: 'کاربرد', value: r.category === 'دیزلی' ? 'موتور دیزلی' : 'موتور بنزینی' },
        { group: 'مشخصات فنی', name: 'کد کالا', value: r.code }
      ]
    });
  }

  // featured / bestsellers
  for (const n of ['بهران توربین 32', 'بهران هیدرولیک H 68', 'بهران بردبار 220', 'بهران رانا 20W-50 ۴ لیتری', 'بهران سوپر پیشتاز 10W-40 ۴ لیتری', 'بهران سوپر رانا پلاس 5W-30 ۴ لیتری', 'بهران سمند 85W-90 کوارت', 'بهران اتوماتیک II کوارت'])
    await prisma.product.updateMany({ where: { name: n }, data: { isFeatured: true } });
  for (const n of ['بهران توربین 32', 'بهران هیدرولیک H 68', 'بهران رانا 20W-50 ۴ لیتری', 'بهران سوپر پیشتاز 10W-40 ۴ لیتری', 'بهران رانا 10W-40 ۴ لیتری', 'بهران سمند 85W-90 کوارت'])
    await prisma.product.updateMany({ where: { name: n }, data: { isBestSeller: true } });

  // banners
  await prisma.banner.createMany({ data: [
    { title: 'روغن اصل، قیمت کارخانه', subtitle: 'با ضمانت اصالت کالا و ارسال سریع به سراسر کشور', buttonText: 'همین حالا خرید کن', url: '/products', image: '/images/banners/hero-1.jpg', section: 'hero', sortOrder: 1 },
    { title: 'پیشنهاد ویژه این هفته', subtitle: 'تا ۲۵٪ تخفیف روی برندهای منتخب', buttonText: 'مشاهده تخفیف‌ها', url: '/products?offer=1', image: '/images/banners/hero-2.jpg', section: 'hero', sortOrder: 2 },
    { title: 'ارسال رایگان', subtitle: 'برای خریدهای بالای ۳ میلیون تومان', buttonText: 'شرایط ارسال', url: '/products', image: '/images/banners/hero-3.jpg', section: 'hero', sortOrder: 3 }
  ]});

  // homepage sections
  const sections = [
    ['hero', 'بنر اصلی', null], ['categories', 'دسته‌بندی محصولات', 'انتخاب بر اساس نیاز شما'],
    ['featured', 'محصولات ویژه', 'منتخب بهترین‌ها'], ['bestsellers', 'پرفروش‌ترین‌ها', 'محبوب مشتریان'],
    ['offers', 'پیشنهادهای شگفت‌انگیز', 'تخفیف‌های محدود'], ['vehicle', 'روغن مناسب خودروی خود را پیدا کنید', 'برند، مدل و سال خودرو'],
    ['brands', 'برندهای معتبر', null], ['whyus', 'چرا روغن‌لند؟', 'ضمانت اصالت و ارسال سریع'],
    ['blog', 'آخرین مقالات', 'راهنمای انتخاب روغن'], ['testimonials', 'نظرات مشتریان', 'اعتماد شما سرمایه ماست'],
    ['newsletter', 'خبرنامه', null]
  ] as const;
  for (let i = 0; i < sections.length; i++) {
    await prisma.homepageSection.create({ data: { key: sections[i][0], title: sections[i][1], subtitle: sections[i][2], enabled: true, sortOrder: i + 1 } });
  }

  // shipping
  await prisma.shippingMethod.createMany({ data: [
    { name: 'پست پیشتاز', description: 'ارسال به سراسر کشور', price: 45000, estimatedDays: '۲ تا ۴ روز کاری', freeThreshold: 3000000, sortOrder: 1 },
    { name: 'تیپاکس', description: 'ارسال سریع به شهرهای بزرگ', price: 65000, estimatedDays: '۱ تا ۲ روز کاری', sortOrder: 2 },
    { name: 'باربری', description: 'برای خریدهای عمده', price: 120000, estimatedDays: '۲ تا ۵ روز کاری', sortOrder: 3 }
  ]});

  // testimonials + FAQ
  await prisma.testimonial.createMany({ data: [
    { name: 'محمد کریمی', role: 'دارنده پژو ۲۰۶', content: 'روغن اصل و با قیمت مناسب ارسال شد. سرعت ارسال عالی بود.', rating: 5, sortOrder: 1 },
    { name: 'سارا احمدی', role: 'دارنده هیوندای توسان', content: 'مشاوره تخصصی قبل از خرید کمکم کرد روغن مناسب انتخاب کنم.', rating: 5, sortOrder: 2 },
    { name: 'رضا موسوی', role: 'دارنده کمری ۲۰۱۸', content: 'بسته‌بندی و ارسال کاملاً حرفه‌ای بود.', rating: 5, sortOrder: 3 }
  ]});
  await prisma.faq.createMany({ data: [
    { question: 'چطور از اصالت روغن مطمئن شوم؟', answer: 'تمام محصولات دارای هولوگرام و کد اصالت هستند که از سامانه رسمی قابل استعلام است.', sortOrder: 1 },
    { question: 'ارسال سفارش چقدر طول می‌کشد؟', answer: 'تهران ۱ تا ۲ روز کاری و شهرستان‌ها ۲ تا ۴ روز کاری.', sortOrder: 2 },
    { question: 'آیا امکان مرجوعی وجود دارد؟', answer: 'در صورت وجود مغایرت یا ایراد، تا ۷ روز امکان مرجوعی وجود دارد.', sortOrder: 3 }
  ]});

  // blog
  const bcGuide = await prisma.blogCategory.create({ data: { name: 'راهنمای خرید', slug: 'buying-guide' } });
  const bcMaint = await prisma.blogCategory.create({ data: { name: 'نگهداری خودرو', slug: 'maintenance' } });
  const posts = [
    { title: 'راهنمای انتخاب روغن موتور مناسب خودرو', slug: 'how-to-choose-engine-oil', catId: bcGuide.id, cover: '/images/blog/blog-1.jpg' },
    { title: 'تفاوت روغن سنتتیک و نیمه سنتتیک چیست؟', slug: 'synthetic-vs-semi-synthetic', catId: bcGuide.id, cover: '/images/blog/blog-2.jpg' },
    { title: 'هر چند کیلومتر باید روغن موتور را تعویض کرد؟', slug: 'oil-change-interval', catId: bcMaint.id, cover: '/images/blog/blog-3.jpg' },
    { title: 'آشنایی با استانداردهای API و ACEA', slug: 'api-acea-standards', catId: bcGuide.id, cover: '/images/blog/blog-4.jpg' }
  ];
  for (const b of posts) {
    await prisma.blogPost.create({ data: { title: b.title, slug: b.slug, excerpt: b.title, coverImage: b.cover, content: `<p>${b.title}</p>`, categoryId: b.catId, status: 'published', publishedAt: new Date(), seoTitle: b.title } });
  }

  // pages
  await prisma.page.createMany({ data: [
    { title: 'درباره ما', slug: 'about-us', isSystem: true, content: '<p>روغن‌لند فروشگاه تخصصی روغن موتور و روانکار با ضمانت اصالت کالا است.</p>' },
    { title: 'شرایط استفاده', slug: 'terms', isSystem: true, content: '<p>استفاده از خدمات فروشگاه به منزله پذیرش قوانین است.</p>' },
    { title: 'حریم خصوصی', slug: 'privacy', isSystem: true, content: '<p>اطلاعات شما نزد روغن‌لند محفوظ است.</p>' },
    { title: 'تماس با ما', slug: 'contact-us', isSystem: true, content: '<p>تلفن: ۰۲۱-۹۱۰۰۰۰۰۰</p>' }
  ]});

  // settings
  const setting = (key: string, value: unknown, group: string) =>
    prisma.siteSetting.create({ data: { key, value: JSON.stringify(value), group } });
  await setting('storeName', 'روغن‌لند', 'general');
  await setting('currencyLabel', 'تومان', 'general');
  await setting('phone', '021-91000000', 'general');
  await setting('email', 'info@oilland.shop', 'general');
  await setting('address', 'تهران، خیابان ولیعصر، پلاک ۱۲۳۴', 'general');
  await setting('workingHours', 'شنبه تا پنجشنبه، ۹ تا ۱۸', 'general');
  await setting('freeShippingThreshold', 3000000, 'general');
  await setting('footerAbout', 'روغن‌لند فروشگاه تخصصی روغن موتور و روانکار خودرو با ضمانت اصالت کالا.', 'general');
  await setting('logoUrl', '/images/logo.png', 'branding');
  await setting('faviconUrl', '/images/logo.png', 'branding');
  await setting('primaryColor', '#0b554d', 'branding');
  await setting('metaTitle', 'روغن‌لند | فروشگاه اینترنتی روغن موتور و روانکار', 'seo');
  await setting('metaDescription', 'خرید اینترنتی انواع روغن موتور با ضمانت اصالت کالا و ارسال سریع.', 'seo');

  const total = await prisma.product.count();
  console.log(`[db-setup] ✅ Seed کامل شد — ${total} محصول`);
}

let setupPromise: Promise<{ ok: boolean; error?: string }> | null = null;

async function setupDatabaseInner(): Promise<{ ok: boolean; error?: string }> {
  try {
    console.log('[db-setup] بررسی وضعیت دیتابیس…');
    if (!(await tablesExist())) {
      console.log('[db-setup] جدول‌ها وجود ندارند — در حال ساخت…');
      await createTables();
    } else {
      console.log('[db-setup] جدول‌ها موجودند');
    }
    await seed();

    // repair: همیشه (حتی روی دیتابیس موجود) عکس‌های دسته‌بندی خالی را پر کن
    const ALL_CATS = [
      ...PARENT_CATS.map((p) => p.slug),
      ...CHILD_CATS.map((c) => c.slug)
    ];
    let repaired = 0;
    for (const slug of ALL_CATS) {
      const r = await prisma.category.updateMany({
        where: { slug, image: null },
        data: { image: `/images/categories/${slug}.svg` }
      });
      repaired += r.count;
    }
    if (repaired > 0) console.log(`[db-setup] 🔧 ${repaired} تصویر دسته‌بندی ترمیم شد`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[db-setup] ✖ خطا:', msg.split('\n')[0]);
    setupPromise = null;
    return { ok: false, error: msg.split('\n')[0] };
  }
}

export function setupDatabase(): Promise<{ ok: boolean; error?: string }> {
  if (setupPromise) return setupPromise;
  setupPromise = setupDatabaseInner();
  return setupPromise;
}
