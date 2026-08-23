// ─────────────────────────────────────────────────────────────────────────────
//  Import 35 Behran MOTOR oil products (consumer price only, no base price)
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import { slugify, uniqueSlug } from '../src/lib/slug';

const prisma = new PrismaClient();

type Row = {
  row: string; code: string; name: string; grade: string; category: 'بنزینی' | 'دیزلی';
  packaging: string; consumer: number;
};
const RAW: Row[] = JSON.parse(fs.readFileSync('data/motor_final.json', 'utf-8'));

const IMG: Record<string, { file: string; match: 'exact' | 'family'; source: string }> = {
  'بهران بندر توربو 50': { file: '/images/motor/turbo-diesel.webp', match: 'family', source: 'https://www.isna.ir/news/98032109458/' },
  'بهران توربو لاین 25W-50': { file: '/images/motor/turbo-diesel.webp', match: 'family', source: 'https://www.isna.ir/news/98032109458/' },
  'بهران توربو دیزل 20W-50': { file: '/images/motor/turbo-diesel.webp', match: 'exact', source: 'https://www.isna.ir/news/98032109458/' },
  'بهران سوپر توربو ران 20W-50': { file: '/images/motor/super-turbo-ran.webp', match: 'exact', source: 'https://fabrickala.com/car-consumables/diesel-engine-oil' },
  'بهران اکسترا توربو دیزل 15W-40': { file: '/images/motor/extra-turbo.webp', match: 'exact', source: 'https://mrroghan.com/product/بهران-اکسترا-توربو-دیزل-15w40' },
  'بهران توربو E5 10W-40': { file: '/images/motor/turbo-diesel.webp', match: 'family', source: 'https://www.behranoil.co/fa/product/2867-بهران-توربو-E5-10W-40.html' },
  'بهران تکتاز پریمیوم 20W-50': { file: '/images/motor/taktaz.webp', match: 'exact', source: 'https://itoll.com/shop/product/روغن-موتور-بهران-تکتاز-20w50/' },
  'بهران پیشتاز 10W-40': { file: '/images/motor/super-pishtaz.webp', match: 'family', source: 'https://matia.ir/روغن-موتور-بهران-سوپر-پیشتاز-10W40' },
  'بهران سوپر پیشتاز پریمیوم 20W-50': { file: '/images/motor/super-pishtaz.webp', match: 'family', source: 'https://basalam.com/ojhanyadak/product/2081804' },
  'بهران سوپر پیشتاز 10W-40': { file: '/images/motor/super-pishtaz.webp', match: 'exact', source: 'https://basalam.com/ojhanyadak/product/2081804' },
  'بهران رانا 20W-50': { file: '/images/motor/rana.webp', match: 'exact', source: 'https://basalam.com/zeytoon_taroom/product/3609941' },
  'بهران رانا 10W-40': { file: '/images/motor/rana.webp', match: 'family', source: 'https://basalam.com/cat/auto/روغن-موتور-رانا' },
  'بهران سوپر رانا 5W-40': { file: '/images/motor/super-rana.webp', match: 'family', source: 'https://basalam.com/sajjad_khalili/product/3144991' },
  'بهران سوپر رانا 0W-20': { file: '/images/motor/super-rana.webp', match: 'family', source: 'https://basalam.com/sajjad_khalili/product/3144991' },
  'بهران سوپر رانا پلاس 10W-40': { file: '/images/motor/super-rana-plus.webp', match: 'family', source: 'https://basalam.com/sajjad_khalili/product/3144991' },
  'بهران سوپر رانا پلاس 5W-30': { file: '/images/motor/super-rana-plus.webp', match: 'exact', source: 'https://basalam.com/sajjad_khalili/product/3144991' },
  'بهران سوپر رانا پلاس 0W-20': { file: '/images/motor/super-rana-plus.webp', match: 'family', source: 'https://basalam.com/sajjad_khalili/product/3144991' },
  'بهران اولترا رانا 5W-30': { file: '/images/motor/rana.webp', match: 'family', source: 'https://basalam.com/cat/auto/روغن-موتور-رانا' }
};

const DESCRIPTIONS: Record<string, string> = {
  'بندر توربو': 'روغن موتور دیزلی تک‌درجه‌ای (SAE 50) برای موتورهای دیزلی سنگین سوپرشارژ و توربوشارژ؛ مناسب ماشین‌آلات راه‌سازی، کشاورزی و معدنی.',
  'توربو لاین': 'روغن موتور دیزلی چنددرجه‌ای برای موتورهای دیزلی سنگین با عملکرد بالا و حفاظت در برابر سایش.',
  'توربو دیزل': 'روغن موتور دیزلی برای کامیون‌ها و اتوبوس‌ها با پایداری حرارتی و خواص پاک‌کنندگی مناسب.',
  'سوپر توربو ران': 'روغن موتور دیزلی با کیفیت بالا برای اتوبوس‌ها و کامیون‌های مجهز به سیستم کنترل آلودگی (EGR) در شرایط کاری سخت.',
  'اکسترا توربو دیزل': 'روغن موتور دیزلی ممتاز برای اتوبوس‌ها و کامیون‌های جدید با قلیائیت بالا و محافظت از موتور.',
  'توربو E5': 'روغن موتور دیزلی با استاندارد آلایندگی E5 مناسب خودروهای دیزلی مدرن.',
  'تکتاز پریمیوم': 'روغن موتور بنزینی اقتصادی با کیفیت مناسب برای خودروهای داخلی.',
  'پیشتاز': 'روغن موتور بنزینی چنددرجه‌ای با کیفیت مناسب برای خودروهای سواری.',
  'سوپر پیشتاز': 'روغن موتور بنزینی با سطح کیفی SL برای موتورهای سواری مدرن.',
  'رانا': 'روغن موتور بنزینی پرفروش برای خودروهای داخلی با پایداری حرارتی مناسب.',
  'سوپر رانا': 'روغن موتور بنزینی تمام سنتتیک با سطح کیفی SN برای موتورهای مدرن.',
  'سوپر رانا پلاس': 'روغن موتور بنزینی تمام سنتتیک با استاندارد API SN Plus برای خودروهای جدید.',
  'اولترا رانا': 'روغن موتور بنزینی تمام سنتتیک ممتاز برای خودروهای جدید و پرفورمنس.'
};

function descFor(name: string): string {
  for (const [key, d] of Object.entries(DESCRIPTIONS)) {
    if (name.includes(key)) return d;
  }
  return 'روغن موتور شرکت نفت بهران با کیفیت و استانداردهای روز.';
}

async function main() {
  console.log('▶ دسته‌بندی‌های روغن موتور…');
  const parent = await prisma.category.upsert({
    where: { slug: 'engine-oil' },
    update: { name: 'روغن موتور', deletedAt: null, parentId: null, sortOrder: 4 },
    create: { name: 'روغن موتور', slug: 'engine-oil', sortOrder: 4 }
  });
  const gasoline = await prisma.category.upsert({
    where: { slug: 'engine-oil-gasoline' },
    update: { name: 'روغن موتور بنزینی', deletedAt: null, parentId: parent.id, sortOrder: 1 },
    create: { name: 'روغن موتور بنزینی', slug: 'engine-oil-gasoline', parentId: parent.id, sortOrder: 1 }
  });
  const diesel = await prisma.category.upsert({
    where: { slug: 'engine-oil-diesel' },
    update: { name: 'روغن موتور دیزلی', deletedAt: null, parentId: parent.id, sortOrder: 2 },
    create: { name: 'روغن موتور دیزلی', slug: 'engine-oil-diesel', parentId: parent.id, sortOrder: 2 }
  });

  const brand = await prisma.brand.findUnique({ where: { slug: 'behran' } });

  console.log('▶ درج ۳۵ محصول موتوری (فقط قیمت مصرف‌کننده)…');
  let exact = 0, family = 0;
  for (const r of RAW) {
    const baseName = r.name; // e.g. "بهران رانا 20W-50"
    const slug = await uniqueSlug(baseName, async (s) => Boolean(await prisma.product.findUnique({ where: { slug: s } })));
    const img = IMG[baseName] ?? { file: '/images/behran/generic-drum.svg', match: 'family' as const, source: '' };
    if (img.match === 'exact') exact++; else family++;

    const product = await prisma.product.create({
      data: {
        name: baseName,
        slug,
        shortDescription: `${descFor(baseName)} این محصول در گرید ${r.grade} و بسته‌بندی ${r.packaging} عرضه می‌شود.`,
        description: descFor(baseName),
        brandId: brand!.id,
        categoryId: r.category === 'دیزلی' ? diesel.id : gasoline.id,
        price: Math.round(r.consumer / 10), // ریال ← تومان (فقط قیمت مصرف‌کننده)
        salePrice: null,
        sku: r.code,
        barcode: null,
        stock: 100,
        lowStockThreshold: 5,
        isPublished: true,
        seoTitle: baseName,
        seoDescription: descFor(baseName)
      }
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: img.file,
        alt: `${baseName} — ${r.packaging}`,
        sortOrder: 0,
        isMain: true,
        sourceUrl: img.source || null,
        matchLevel: img.match,
        fileName: slugify(baseName) + '.webp'
      }
    });

    const specs = [
      { group: 'مشخصات فنی', name: 'گرید', value: r.grade, sortOrder: 0 },
      { group: 'مشخصات فنی', name: 'نوع بسته‌بندی', value: r.packaging, sortOrder: 1 },
      { group: 'مشخصات فنی', name: 'کاربرد', value: r.category === 'دیزلی' ? 'موتور دیزلی' : 'موتور بنزینی', sortOrder: 2 },
      { group: 'مشخصات فنی', name: 'کد کالا', value: r.code, sortOrder: 3 }
    ];
    for (const s of specs) {
      await prisma.productSpec.create({ data: { productId: product.id, ...s } });
    }
  }

  // featured/bestseller for storefront
  for (const name of ['بهران رانا 20W-50', 'بهران سوپر پیشتاز 10W-40', 'بهران سوپر رانا پلاس 5W-30', 'بهران توربو دیزل 20W-50', 'بهران سوپر رانا 5W-40', 'بهران تکتاز پریمیوم 20W-50', 'بهران اکسترا توربو دیزل 15W-40', 'بهران سوپر توربو ران 20W-50']) {
    await prisma.product.updateMany({ where: { name }, data: { isFeatured: true } });
  }
  for (const name of ['بهران رانا 20W-50', 'بهران رانا 10W-40', 'بهران سوپر پیشتاز 10W-40', 'بهران توربو دیزل 20W-50', 'بهران سوپر رانا 5W-40', 'بهران سوپر رانا پلاس 5W-30']) {
    await prisma.product.updateMany({ where: { name }, data: { isBestSeller: true } });
  }

  const total = await prisma.product.count({ where: { deletedAt: null } });
  console.log('\n══════════ گزارش ══════════');
  console.log('محصولات موتوری واردشده:', RAW.length);
  console.log('کل محصولات سایت:', total);
  console.log('تصاویر دقیق (exact):', exact);
  console.log('تصاویر هم‌خانواده (family):', family);
  console.log('قیمت: فقط قیمت مصرف‌کننده (پایه حذف شد)');
  console.log('═══════════════════════');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
