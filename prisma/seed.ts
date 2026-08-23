// ─────────────────────────────────────────────────────────────────────────────
//  Oil Shop — production seed (PostgreSQL)
//  Idempotent: skips if any user already exists.
//  Imports the real Behran catalog:
//     • 141 industrial lubricants  (data/products.json)
//     • 35  engine oils           (data/motor_final.json)
//  plus categories, brand, banners, content, settings, shipping, vehicles…
//  Product images are generated as branded SVGs (same look as the live demo).
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_PERMISSION_SLUGS } from '../src/lib/constants';
import { slugify, uniqueSlug } from '../src/lib/slug';

const prisma = new PrismaClient();

// ─────────────────────────── Data files ───────────────────────────
const INDUSTRIAL = JSON.parse(fs.readFileSync('data/products.json', 'utf-8')) as {
  row: string; code: string; name: string; grade: string; packaging: string; price: number;
}[];
const MOTOR = JSON.parse(fs.readFileSync('data/motor_final.json', 'utf-8')) as {
  row: string; code: string; name: string; grade: string; category: 'بنزینی' | 'دیزلی'; packaging: string; consumer: number;
}[];

// ─────────────────────────── Categories ───────────────────────────
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

// ─────────────────────────── Industrial family → category ──────────────────
const FAMILY_CAT: Record<string, string> = {
  'بهران توربین': 'turbine-oils',
  'بهران درفش': 'industrial-gear-oils',
  'بهران هیدرولیک': 'hydraulic-oils',
  'بهران بردبار': 'industrial-gear-oils',
  'بهران گردان UTTO': 'tractor-oils',
  'بهران گردان ویژه 56': 'tractor-oils',
  'بهران برش': 'metalworking-oils',
  'بهران تراش': 'metalworking-oils',
  'بهران مقاوم': 'metalworking-oils',
  'بهران بافت': 'textile-oils',
  'بهران دوخت': 'textile-oils',
  'بهران حرارت': 'heat-transfer-oils',
  'بهران آبکار': 'heat-treatment-oils',
  'بهران آبکار ویژه': 'heat-treatment-oils',
  'بهران آبکار گرم': 'heat-treatment-oils',
  'بهران کمپرسور': 'compressor-oils',
  'بهران سرد ویژه': 'refrigeration-oils',
  'بهران مته': 'metalworking-oils',
  'بهران پاک': 'general-purpose',
  'بهران محافظ': 'rust-preventives',
  'بهران آذرخش ویژه': 'transformer-oils',
  'بهران سمند': 'gear-oils',
  'بهران سمند ویژه': 'gear-oils',
  'بهران اتوماتیک': 'atf'
};

const DESC: Record<string, string> = {
  'بهران توربین': 'روغن توربین بهران با روغن پایه معدنی مرغوب و افزودنی‌های ضد اکسیداسیون و ضد زنگ برای روانکاری توربین‌های بخار، گاز و آب و سیستم‌های گردشی طراحی شده است.',
  'بهران درفش': 'روغن دنده صنعتی بهران درفش با خواص ضد سایش و تحمل بار بالا برای روانکاری گیربکس‌های صنعتی و سیستم‌های انتقال قدرت طراحی شده است.',
  'بهران هیدرولیک': 'روغن هیدرولیک بهران با پایداری حرارتی و خواص ضد سایش مناسب برای روانکاری سیستم‌های هیدرولیک و گردشی صنعتی طراحی شده است.',
  'بهران بردبار': 'روغن دنده صنعتی سنگین بهران بردبار برای روانکاری چرخ‌دنده‌های صنعتی در شرایط بار و فشار بالا طراحی شده است.',
  'بهران گردان': 'روغن چندمنظوره بهران گردان برای روانکاری سیستم انتقال نیرو، کلاچ، ترمز مرطوب و هیدرولیک تراکتورها و ماشین‌آلات کشاورزی و برون‌جاده‌ای طراحی شده است.',
  'بهران برش': 'روغن برشکاری بهران برای روانکاری و خنک‌کاری عملیات برش و ماشین‌کاری فلزات طراحی شده است.',
  'بهران تراش': 'روغن تراشکاری بهران برای روانکاری و خنک‌کاری عملیات ماشین‌کاری دقیق فلزات مناسب است.',
  'بهران مقاوم': 'روغن بهران مقاوم برای روانکاری مته‌های سنگ‌بری، ماشین‌آلات معدن و تجهیزات دارای بار ضربه‌ای بالا طراحی شده است.',
  'بهران بافت': 'روغن نساجی بهران بافت برای روانکاری ماشین‌آلات بافندگی و ریسندگی در صنعت نساجی طراحی شده است.',
  'بهران دوخت': 'روغن بهران دوخت برای روانکاری ماشین‌آلات دوخت صنعتی و تجهیزات نساجی مناسب است.',
  'بهران حرارت': 'روغن انتقال حرارت بهران برای سیستم‌های گرمایش غیرمستقیم صنعتی با پایداری حرارتی بالا طراحی شده است.',
  'بهران آبکار': 'روغن آبکار بهران برای عملیات حرارتی فلزات و فرآیندهای آبکاری و سخت‌کاری طراحی شده است.',
  'بهران کمپرسور': 'روغن کمپرسور بهران برای روانکاری کمپرسورهای هوا با پایداری اکسیداسیون مناسب طراحی شده است.',
  'بهران سرد ویژه': 'روغن کمپرسور برودتی بهران سرد ویژه برای روانکاری کمپرسورهای سیستم‌های تبرید و تهویه مطبوع طراحی شده است.',
  'بهران مته': 'روغن بهران مته برای روانکاری مته‌ها و ابزارهای حفاری و ماشین‌کاری طراحی شده است.',
  'بهران پاک': 'روغن پاک‌کننده بهران برای تمیزکاری و شست‌وشوی قطعات و تجهیزات صنعتی مناسب است.',
  'بهران محافظ': 'روغن ضدزنگ و محافظ بهران برای محافظت موقت قطعات و سطوح فلزی در برابر خوردگی و زنگ‌زدگی طراحی شده است.',
  'بهران آذرخش ویژه': 'روغن الکتریکال بهران آذرخش ویژه برای عایق‌کاری و خنک‌کاری ترانسفورماتورها و تجهیزات الکتریکی طراحی شده است.',
  'بهران سمند': 'روغن گیربکس دنده‌ای بهران سمند برای روانکاری گیربکس‌های دستی و دیفرانسیل خودروهای سبک طراحی شده است.',
  'بهران اتوماتیک': 'روغن گیربکس اتوماتیک (ATF) بهران برای روانکاری گیربکس‌های اتوماتیک خودرو طراحی شده است.'
};

const MOTOR_DESC: Record<string, string> = {
  'بندر توربو': 'روغن موتور دیزلی تک‌درجه‌ای (SAE 50) برای موتورهای دیزلی سنگین سوپرشارژ و توربوشارژ.',
  'توربو لاین': 'روغن موتور دیزلی چنددرجه‌ای برای موتورهای دیزلی سنگین با عملکرد بالا.',
  'توربو دیزل': 'روغن موتور دیزلی برای کامیون‌ها و اتوبوس‌ها با پایداری حرارتی مناسب.',
  'سوپر توربو ران': 'روغن موتور دیزلی با کیفیت بالا برای اتوبوس‌ها و کامیون‌های مجهز به EGR در شرایط کاری سخت.',
  'اکسترا توربو دیزل': 'روغن موتور دیزلی ممتاز برای اتوبوس‌ها و کامیون‌های جدید با قلیائیت بالا.',
  'توربو E5': 'روغن موتور دیزلی با استاندارد آلایندگی E5 مناسب خودروهای دیزلی مدرن.',
  'تکتاز': 'روغن موتور بنزینی اقتصادی با کیفیت مناسب برای خودروهای داخلی.',
  'پیشتاز': 'روغن موتور بنزینی چنددرجه‌ای با کیفیت مناسب برای خودروهای سواری.',
  'رانا': 'روغن موتور بنزینی پرفروش برای خودروهای داخلی با پایداری حرارتی مناسب.',
  'اولترا رانا': 'روغن موتور بنزینی تمام سنتتیک ممتاز برای خودروهای جدید.'
};

function motorDesc(name: string): string {
  for (const [key, d] of Object.entries(MOTOR_DESC)) {
    if (name.includes(key)) return d;
  }
  return 'روغن موتور شرکت نفت بهران با کیفیت و استانداردهای روز.';
}

const MOTOR_SIZE: Record<string, string> = {
  'سطل ۲۰ لیتری پلاستیکی': '۲۰ لیتری',
  'بشکه ۲۰۸ لیتری': '۲۰۸ لیتری',
  'گالن فلزی': 'گالن فلزی',
  'کوارت فلزی': 'کوارت فلزی',
  'سه و نیم لیتری پلاستیکی': 'سه و نیم لیتری',
  '۱ لیتری پلاستیکی': '۱ لیتری',
  '۴ لیتری پلاستیکی': '۴ لیتری',
  '۵ لیتری پلاستیکی': '۵ لیتری'
};

// ─────────────────────────── Branded SVG image ──────────────────────────
const COLORS: Record<string, [string, string]> = {
  'industrial-oils': ['#0f8270', '#062e2b'],
  'automotive-fluids': ['#9cc32a', '#4a5e1b'],
  'agricultural-lubricants': ['#f59e0b', '#92400e'],
  'engine-oil': ['#10b981', '#065f46'],
  'turbine-oils': ['#06b6d4', '#155e75'],
  'hydraulic-oils': ['#3b82f6', '#1e3a8a'],
  'industrial-gear-oils': ['#64748b', '#0f172a'],
  'compressor-oils': ['#0ea5e9', '#075985'],
  'refrigeration-oils': ['#38bdf8', '#0c4a6e'],
  'heat-transfer-oils': ['#ef4444', '#7f1d1d'],
  'heat-treatment-oils': ['#f43f5e', '#9f1239'],
  'metalworking-oils': ['#7c8aa0', '#1e293b'],
  'textile-oils': ['#8b5cf6', '#4c1d95'],
  'rust-preventives': ['#fb923c', '#7c2d12'],
  'transformer-oils': ['#6366f1', '#312e81'],
  'general-purpose': ['#14b8a6', '#134e4a'],
  'gear-oils': ['#f59e0b', '#78350f'],
  'atf': ['#ec4899', '#9d174d'],
  'tractor-oils': ['#16a34a', '#14532d'],
  'engine-oil-gasoline': ['#f97316', '#7c2d12'],
  'engine-oil-diesel': ['#57534e', '#1c1917']
};

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function containerShape(packaging: string): string {
  if (packaging.includes('بشکه')) return `<g>
        <ellipse cx="400" cy="570" rx="140" ry="26" fill="#dbe3ec"/>
        <rect x="260" y="330" width="280" height="240" fill="url(#metal)"/>
        <ellipse cx="400" cy="330" rx="140" ry="26" fill="#ffffff"/>
        <ellipse cx="400" cy="330" rx="104" ry="17" fill="#9aa7b6"/>
        <rect x="260" y="398" width="280" height="11" rx="5.5" fill="#9aa7b6" opacity="0.55"/>
        <rect x="260" y="498" width="280" height="11" rx="5.5" fill="#9aa7b6" opacity="0.55"/></g>`;
  if (packaging.includes('کوارت')) return `<g>
        <rect x="360" y="268" width="80" height="36" rx="7" fill="url(#metal)"/>
        <rect x="318" y="300" width="164" height="242" rx="18" fill="url(#metal)"/>
        <rect x="318" y="300" width="164" height="46" rx="18" fill="#e8edf3"/></g>`;
  if (packaging.includes('سطل') || packaging.includes('گالن')) return `<g>
        <path d="M300 330 L332 560 Q334 592 366 592 L434 592 Q466 592 468 560 L500 330 Z" fill="url(#metal)"/>
        <rect x="300" y="330" width="200" height="24" rx="10" fill="#e8edf3"/>
        <path d="M342 330 Q400 248 458 330" fill="none" stroke="#c7d1dd" stroke-width="15" stroke-linecap="round"/></g>`;
  return `<g>
        <rect x="356" y="176" width="88" height="64" rx="10" fill="url(#metal)"/>
        <rect x="340" y="234" width="120" height="26" rx="10" fill="#e8edf3"/>
        <path d="M336 258 h128 v74 c0 18 -14 26 -30 26 h-68 c-16 0 -30 -8 -30 -26 Z" fill="url(#metal)"/>
        <rect x="336" y="332" width="128" height="216" rx="20" fill="url(#metal)"/></g>`;
}

function gradeFont(g: string): number {
  const len = [...g].length;
  if (len <= 3) return 62;
  if (len <= 6) return 52;
  if (len <= 10) return 44;
  return 36;
}

function productSvg({ c1, c2, packaging, grade, catName }: { c1: string; c2: string; packaging: string; grade: string; catName: string }): string {
  const f = gradeFont(grade);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#f8fafc"/><stop offset="45%" stop-color="#eef2f7"/><stop offset="100%" stop-color="#cfd8e3"/></linearGradient>
    <linearGradient id="label" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c8e549"/><stop offset="100%" stop-color="#9cc32a"/></linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="700" cy="110" r="230" fill="#ffffff" opacity="0.07"/>
  <circle cx="60" cy="740" r="200" fill="#000000" opacity="0.12"/>
  <text x="44" y="66" font-family="sans-serif" font-size="30" font-weight="700" fill="#ffffff" opacity="0.92">نفت بهران</text>
  <text x="44" y="756" font-family="sans-serif" font-size="23" fill="#ffffff" opacity="0.66">${esc(catName)}</text>
  ${containerShape(packaging)}
  <rect x="248" y="410" width="304" height="98" rx="20" fill="url(#label)"/>
  <text x="400" y="473" text-anchor="middle" font-family="Arial, sans-serif" font-size="${f}" font-weight="800" fill="#062e2b">${esc(grade)}</text>
</svg>`;
}

const IMG_DIR = path.join(process.cwd(), 'public', 'images', 'products', 'branded');

// ─────────────────────────── Main ───────────────────────────
async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('⚠️  Database already seeded — skipping.');
    return;
  }

  // 1. permissions + roles
  console.log('🌱 permissions & roles…');
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
    for (const slug of r.perms) {
      if (permIds[slug]) await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permIds[slug] } });
    }
  }

  // 2. users
  console.log('🌱 users…');
  const adminRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  await prisma.user.create({
    data: { email: 'admin@example.com', name: 'مدیر ارشد', passwordHash: await bcrypt.hash('admin123', 10), roleId: adminRole!.id, isActive: true }
  });
  await prisma.user.create({
    data: { email: 'customer@example.com', name: 'علی رضایی', phone: '09121234567', passwordHash: await bcrypt.hash('customer123', 10), roleId: adminRole!.id, isActive: true }
  });

  // 3. categories
  console.log('🌱 categories…');
  const parentIds: Record<string, string> = {};
  for (const p of PARENT_CATS) {
    const c = await prisma.category.create({ data: { name: p.name, slug: p.slug, description: p.desc, sortOrder: p.sort } });
    parentIds[p.slug] = c.id;
  }
  const catIds: Record<string, string> = {};
  for (const ch of CHILD_CATS) {
    const c = await prisma.category.create({ data: { name: ch.name, slug: ch.slug, parentId: parentIds[ch.parent], sortOrder: ch.sort } });
    catIds[ch.slug] = c.id;
  }

  // 4. brand
  console.log('🌱 brand…');
  const brand = await prisma.brand.create({
    data: {
      name: 'نفت بهران', slug: 'behran', logo: '/images/behran/logo.webp',
      description: 'شرکت نفت بهران، بزرگ‌ترین تولیدکننده روغن‌های موتور و صنعتی در ایران با بیش از ۶۰ سال تجربه.'
    }
  });

  // 5. products
  console.log('🌱 products…');
  fs.mkdirSync(IMG_DIR, { recursive: true });

  const createProductWithImage = async (input: {
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
    // branded SVG — only write if missing (images are already committed to the repo)
    const [c1, c2] = COLORS[input.catSlug] || ['#0f8270', '#062e2b'];
    const catName = [...PARENT_CATS, ...CHILD_CATS].find((c) => c.slug === input.catSlug)?.name || 'محصولات بهران';
    const svgPath = path.join(IMG_DIR, `${input.slug}.svg`);
    if (!fs.existsSync(svgPath)) {
      fs.writeFileSync(svgPath, productSvg({ c1, c2, packaging: input.packaging, grade: input.grade, catName }), 'utf-8');
    }
    await prisma.productImage.create({
      data: { productId: product.id, url: `/images/products/branded/${input.slug}.svg`, alt: `${input.name} — گرید ${input.grade}`, sortOrder: 0, isMain: true, matchLevel: 'branded', fileName: `${input.slug}.svg` }
    });
    return product;
  };

  const exists = (slug: string) => prisma.product.findUnique({ where: { slug } });

  // industrial — precompute duplicate names (same name+grade in different packaging)
  const groupCount: Record<string, number> = {};
  for (const r of INDUSTRIAL) {
    const fullName = r.grade ? `${r.name} ${r.grade}` : r.name;
    groupCount[fullName] = (groupCount[fullName] ?? 0) + 1;
  }
  for (const r of INDUSTRIAL) {
    const fullName = r.grade ? `${r.name} ${r.grade}` : r.name;
    // append packaging whenever the name+grade is shared across multiple packagings
    const name = groupCount[fullName] > 1 ? `${fullName} ${r.packaging}` : fullName;
    const desc = DESC[r.name] ?? 'روانکار صنعتی شرکت نفت بهران.';
    const slug = await uniqueSlug(name, async (s) => Boolean(await exists(s)));
    await createProductWithImage({
      name, slug, desc, catSlug: FAMILY_CAT[r.name] ?? 'general-purpose',
      price: Math.round(r.price / 10), sku: r.code, packaging: r.packaging, grade: r.grade,
      specs: [
        { group: 'مشخصات', name: 'گرید', value: r.grade },
        { group: 'مشخصات', name: 'نوع بسته‌بندی', value: r.packaging }
      ]
    });
  }

  // motor
  for (const r of MOTOR) {
    const size = MOTOR_SIZE[r.packaging] ?? r.packaging;
    const name = `${r.name} ${size}`;
    const desc = motorDesc(r.name);
    const slug = await uniqueSlug(name, async (s) => Boolean(await exists(s)));
    await createProductWithImage({
      name, slug, desc, catSlug: r.category === 'دیزلی' ? 'engine-oil-diesel' : 'engine-oil-gasoline',
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
  const featured = ['بهران توربین 32', 'بهران هیدرولیک H 68', 'بهران بردبار 220', 'بهران کمپرسور VDL 68', 'بهران سرد ویژه 32', 'بهران گردان UTTO 10W-30', 'بهران رانا 20W-50 ۴ لیتری', 'بهران سوپر پیشتاز 10W-40 ۴ لیتری', 'بهران سوپر رانا پلاس 5W-30 ۴ لیتری', 'بهران توربو دیزل 20W-50 ۲۰ لیتری', 'بهران سمند 85W-90 کوارت', 'بهران اتوماتیک II کوارت'];
  const best = ['بهران توربین 32', 'بهران هیدرولیک H 68', 'بهران رانا 20W-50 ۴ لیتری', 'بهران سوپر پیشتاز 10W-40 ۴ لیتری', 'بهران رانا 10W-40 ۴ لیتری', 'بهران سوپر رانا 5W-40 ۴ لیتری', 'بهران سمند 85W-90 کوارت', 'بهران بردبار 220'];
  for (const n of featured) await prisma.product.updateMany({ where: { name: n }, data: { isFeatured: true } });
  for (const n of best) await prisma.product.updateMany({ where: { name: n }, data: { isBestSeller: true } });

  // 6. banners
  console.log('🌱 banners…');
  await prisma.banner.createMany({
    data: [
      { title: 'روغن اصل، قیمت کارخانه', subtitle: 'با ضمانت اصالت کالا و ارسال سریع به سراسر کشور', buttonText: 'همین حالا خرید کن', url: '/products', image: '/images/banners/hero-1.jpg', section: 'hero', sortOrder: 1 },
      { title: 'پیشنهاد ویژه این هفته', subtitle: 'تا ۲۵٪ تخفیف روی برندهای منتخب', buttonText: 'مشاهده تخفیف‌ها', url: '/products?offer=1', image: '/images/banners/hero-2.jpg', section: 'hero', sortOrder: 2 },
      { title: 'ارسال رایگان', subtitle: 'برای خریدهای بالای ۳ میلیون تومان', buttonText: 'شرایط ارسال', url: '/products', image: '/images/banners/hero-3.jpg', section: 'hero', sortOrder: 3 }
    ]
  });

  // 7. homepage sections
  console.log('🌱 homepage sections…');
  const sections = [
    ['hero', 'بنر اصلی', null], ['categories', 'دسته‌بندی محصولات', 'انتخاب بر اساس نیاز شما'],
    ['featured', 'محصولات ویژه', 'منتخب بهترین‌ها'], ['bestsellers', 'پرفروش‌ترین‌ها', 'محبوب مشتریان'],
    ['offers', 'پیشنهادهای شگفت‌انگیز', 'تخفیف‌های محدود'], ['vehicle', 'روغن مناسب خودروی خود را پیدا کنید', 'برند، مدل و سال خودرو'],
    ['brands', 'برندهای معتبر', null], ['whyus', 'چرا روغن‌لند؟', 'ضمانت اصالت و ارسال سریع'],
    ['blog', 'آخرین مقالات', 'راهنمای انتخاب روغن'], ['testimonials', 'نظرات مشتریان', 'اعتماد شما سرمایه ماست'],
    ['newsletter', 'خبرنامه', null]
  ] as const;
  for (let i = 0; i < sections.length; i++) {
    const [key, title, subtitle] = sections[i];
    await prisma.homepageSection.create({ data: { key, title, subtitle, enabled: true, sortOrder: i + 1 } });
  }

  // 8. shipping
  console.log('🌱 shipping…');
  await prisma.shippingMethod.createMany({
    data: [
      { name: 'پست پیشتاز', description: 'ارسال به سراسر کشور', price: 45000, estimatedDays: '۲ تا ۴ روز کاری', freeThreshold: 3000000, sortOrder: 1 },
      { name: 'تیپاکس', description: 'ارسال سریع به شهرهای بزرگ', price: 65000, estimatedDays: '۱ تا ۲ روز کاری', sortOrder: 2 },
      { name: 'باربری', description: 'برای خریدهای عمده', price: 120000, estimatedDays: '۲ تا ۵ روز کاری', sortOrder: 3 }
    ]
  });

  // 9. testimonials + FAQ
  console.log('🌱 testimonials & FAQ…');
  await prisma.testimonial.createMany({
    data: [
      { name: 'محمد کریمی', role: 'دارنده پژو ۲۰۶', content: 'روغن اصل و با قیمت مناسب ارسال شد. سرعت ارسال عالی بود.', rating: 5, sortOrder: 1 },
      { name: 'سارا احمدی', role: 'دارنده هیوندای توسان', content: 'مشاوره تخصصی قبل از خرید کمکم کرد روغن مناسب انتخاب کنم.', rating: 5, sortOrder: 2 },
      { name: 'رضا موسوی', role: 'دارنده کمری ۲۰۱۸', content: 'بسته‌بندی و ارسال کاملاً حرفه‌ای بود.', rating: 5, sortOrder: 3 }
    ]
  });
  await prisma.faq.createMany({
    data: [
      { question: 'چطور از اصالت روغن مطمئن شوم؟', answer: 'تمام محصولات دارای هولوگرام و کد اصالت هستند که از سامانه رسمی قابل استعلام است.', sortOrder: 1 },
      { question: 'ارسال سفارش چقدر طول می‌کشد؟', answer: 'تهران ۱ تا ۲ روز کاری و شهرستان‌ها ۲ تا ۴ روز کاری.', sortOrder: 2 },
      { question: 'آیا امکان مرجوعی وجود دارد؟', answer: 'در صورت وجود مغایرت یا ایراد، تا ۷ روز امکان مرجوعی وجود دارد.', sortOrder: 3 }
    ]
  });

  // 10. blog
  console.log('🌱 blog…');
  const bcGuide = await prisma.blogCategory.create({ data: { name: 'راهنمای خرید', slug: 'buying-guide' } });
  const bcMaint = await prisma.blogCategory.create({ data: { name: 'نگهداری خودرو', slug: 'maintenance' } });
  const blogPosts = [
    { title: 'راهنمای انتخاب روغن موتور مناسب خودرو', slug: 'how-to-choose-engine-oil', catId: bcGuide.id, cover: '/images/blog/blog-1.jpg', excerpt: 'انتخاب روغن موتور مناسب مهم‌ترین تصمیم برای سلامت موتور است.' },
    { title: 'تفاوت روغن سنتتیک و نیمه سنتتیک چیست؟', slug: 'synthetic-vs-semi-synthetic', catId: bcGuide.id, cover: '/images/blog/blog-2.jpg', excerpt: 'کدام برای خودروی شما بهتر است؟' },
    { title: 'هر چند کیلومتر باید روغن موتور را تعویض کرد؟', slug: 'oil-change-interval', catId: bcMaint.id, cover: '/images/blog/blog-3.jpg', excerpt: 'بازه مناسب تعویض روغن را بشناسید.' },
    { title: 'آشنایی با استانداردهای API و ACEA', slug: 'api-acea-standards', catId: bcGuide.id, cover: '/images/blog/blog-4.jpg', excerpt: 'استانداردهای روغن چه معنایی دارند؟' }
  ];
  for (const b of blogPosts) {
    await prisma.blogPost.create({
      data: {
        title: b.title, slug: b.slug, excerpt: b.excerpt, coverImage: b.cover,
        content: `<p>${b.excerpt}</p>`, categoryId: b.catId, status: 'published',
        publishedAt: new Date(), seoTitle: b.title
      }
    });
  }

  // 11. pages
  console.log('🌱 pages…');
  await prisma.page.createMany({
    data: [
      { title: 'درباره ما', slug: 'about-us', isSystem: true, content: '<p>روغن‌لند فروشگاه تخصصی روغن موتور و روانکار با ضمانت اصالت کالا است.</p>' },
      { title: 'شرایط استفاده', slug: 'terms', isSystem: true, content: '<p>استفاده از خدمات فروشگاه به منزله پذیرش قوانین است.</p>' },
      { title: 'حریم خصوصی', slug: 'privacy', isSystem: true, content: '<p>اطلاعات شما نزد روغن‌لند محفوظ است.</p>' },
      { title: 'تماس با ما', slug: 'contact-us', isSystem: true, content: '<p>تلفن: ۰۲۱-۹۱۰۰۰۰۰۰</p>' }
    ]
  });

  // 12. settings
  console.log('🌱 settings…');
  const setting = (key: string, value: unknown, group: string) =>
    prisma.siteSetting.create({ data: { key, value: JSON.stringify(value), group } });
  await setting('storeName', 'روغن‌لند', 'general');
  await setting('storeSlogan', 'مرجع تخصصی روغن و روانکار خودرو', 'general');
  await setting('currencyLabel', 'تومان', 'general');
  await setting('phone', '021-91000000', 'general');
  await setting('email', 'info@oillandd.ir', 'general');
  await setting('address', 'تهران، خیابان ولیعصر، پلاک ۱۲۳۴', 'general');
  await setting('workingHours', 'شنبه تا پنجشنبه، ۹ تا ۱۸', 'general');
  await setting('freeShippingThreshold', 3000000, 'general');
  await setting('footerAbout', 'روغن‌لند فروشگاه تخصصی روغن موتور و روانکار خودرو با ضمانت اصالت کالا و مشاوره تخصصی رایگان.', 'general');
  await setting('logoUrl', '/images/logo.png', 'branding');
  await setting('faviconUrl', '/images/logo.png', 'branding');
  await setting('primaryColor', '#0b554d', 'branding');
  await setting('metaTitle', 'روغن‌لند | فروشگاه اینترنتی روغن موتور و روانکار', 'seo');
  await setting('metaDescription', 'خرید اینترنتی انواع روغن موتور، روغن گیربکس، ضدیخ و مکمل با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.', 'seo');

  console.log('\n✅ Seed completed.');
  const counts = {
    products: await prisma.product.count(),
    categories: await prisma.category.count(),
    industrial: INDUSTRIAL.length,
    motor: MOTOR.length
  };
  console.log(`📊 ${counts.products} محصول (${counts.industrial} صنعتی + ${counts.motor} موتوری) | ${counts.categories} دسته‌بندی`);
  console.log('👤 admin@example.com / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
