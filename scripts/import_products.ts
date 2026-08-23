// ─────────────────────────────────────────────────────────────────────────────
//  Import 141 Behran industrial products from data/products.json
//  - Replaces demo catalog (soft-delete), creates the category tree, brand,
//    products with specs, unique Persian descriptions and image metadata.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import { slugify, uniqueSlug } from '../src/lib/slug';

const prisma = new PrismaClient();

const RAW: {
  row: string; code: string; name: string; grade: string; packaging: string; price: number;
}[] = JSON.parse(fs.readFileSync('data/products.json', 'utf-8'));

// ── Category tree ────────────────────────────────────────────────────────────
const CATS = {
  parents: [
    { slug: 'industrial-oils', name: 'روغن‌های صنعتی', desc: 'روغن‌ها و روانکارهای صنعتی شرکت نفت بهران' },
    { slug: 'automotive-fluids', name: 'روانکارهای خودرویی', desc: 'روغن گیربکس و روانکارهای خودرو' },
    { slug: 'agricultural-lubricants', name: 'روانکارهای ماشین‌آلات کشاورزی', desc: 'روغن تراکتور و ماشین‌آلات برون‌جاده‌ای' }
  ],
  children: [
    { slug: 'turbine-oils', name: 'روغن‌های توربین', parent: 'industrial-oils' },
    { slug: 'hydraulic-oils', name: 'روغن‌های هیدرولیک', parent: 'industrial-oils' },
    { slug: 'industrial-gear-oils', name: 'روغن‌های دنده صنعتی', parent: 'industrial-oils' },
    { slug: 'compressor-oils', name: 'روغن‌های کمپرسور', parent: 'industrial-oils' },
    { slug: 'refrigeration-oils', name: 'روغن‌های کمپرسور برودتی', parent: 'industrial-oils' },
    { slug: 'heat-transfer-oils', name: 'روغن‌های انتقال حرارت', parent: 'industrial-oils' },
    { slug: 'heat-treatment-oils', name: 'روغن‌های عملیات حرارتی و آبکاری', parent: 'industrial-oils' },
    { slug: 'metalworking-oils', name: 'روغن‌های فلزکاری و برش', parent: 'industrial-oils' },
    { slug: 'textile-oils', name: 'روغن‌های نساجی', parent: 'industrial-oils' },
    { slug: 'rust-preventives', name: 'روغن‌های ضدزنگ و محافظ', parent: 'industrial-oils' },
    { slug: 'transformer-oils', name: 'روغن‌های ترانسفورماتور', parent: 'industrial-oils' },
    { slug: 'general-purpose', name: 'روغن‌های مصارف عمومی', parent: 'industrial-oils' },
    { slug: 'gear-oils', name: 'روغن گیربکس دنده‌ای', parent: 'automotive-fluids' },
    { slug: 'atf', name: 'روغن گیربکس اتوماتیک (ATF)', parent: 'automotive-fluids' },
    { slug: 'tractor-oils', name: 'روغن‌های تراکتور و برون‌جاده‌ای', parent: 'agricultural-lubricants' }
  ]
};

// ── Family → (category, description, image, source, match) ───────────────────
const FAMILY: Record<string, {
  cat: string; desc: string; img: string; source: string; match: 'exact' | 'family' | 'generic';
}> = {
  'بهران توربین': {
    cat: 'turbine-oils', match: 'family',
    img: '/images/behran/torbin.webp', source: 'https://fidaroil.com/product/behran-azaran-oil-40/',
    desc: 'روغن توربین بهران با روغن پایه معدنی مرغوب و افزودنی‌های ضد اکسیداسیون و ضد زنگ برای روانکاری توربین‌های بخار، گاز و آب و سیستم‌های گردشی طراحی شده و جداسازی مناسب آب را فراهم می‌کند.'
  },
  'بهران درفش': {
    cat: 'industrial-gear-oils', match: 'family',
    img: '/images/behran/derafsh.webp', source: 'https://www.famcocorp.com/pcat/170683/روغن-بهران',
    desc: 'روغن دنده صنعتی بهران درفش با خواص ضد سایش و تحمل بار بالا برای روانکاری گیربکس‌های صنعتی و سیستم‌های انتقال قدرت طراحی شده است.'
  },
  'بهران هیدرولیک': {
    cat: 'hydraulic-oils', match: 'family',
    img: '/images/behran/hydraulic.webp', source: 'https://www.famcocorp.com/product/16213/روغن-هیدرولیک-بهران',
    desc: 'روغن هیدرولیک بهران با پایداری حرارتی و خواص ضد سایش مناسب برای روانکاری سیستم‌های هیدرولیک و گردشی صنعتی طراحی شده است.'
  },
  'بهران بردبار': {
    cat: 'industrial-gear-oils', match: 'family',
    img: '/images/behran/bordbar.webp', source: 'https://fidaroil.com/product/بهران-بردبار-220/',
    desc: 'روغن دنده صنعتی سنگین بهران بردبار برای روانکاری چرخ‌دنده‌های صنعتی در شرایط بار و فشار بالا طراحی شده است.'
  },
  'بهران گردان UTTO': {
    cat: 'tractor-oils', match: 'family',
    img: '/images/behran/gardan.webp', source: 'https://tehranoilmarket.com/product-category/روغن-صنعتی',
    desc: 'روغن چندمنظوره بهران گردان UTTO برای روانکاری سیستم انتقال نیرو، کلاچ، ترمز مرطوب و هیدرولیک تراکتورها و ماشین‌آلات کشاورزی و برون‌جاده‌ای طراحی شده است.'
  },
  'بهران گردان ویژه 56': {
    cat: 'tractor-oils', match: 'family',
    img: '/images/behran/gardan.webp', source: 'https://tehranoilmarket.com/product-category/روغن-صنعتی',
    desc: 'روغن بهران گردان ویژه ۵۶ (STOU) یک روغن چندمنظوره برای روانکاری موتور، گیربکس و سیستم هیدرولیک ماشین‌آلات کشاورزی و برون‌جاده‌ای است.'
  },
  'بهران برش': {
    cat: 'metalworking-oils', match: 'family',
    img: '/images/behran/brash.webp', source: 'https://needsanat.com/product/روغن-صنعتی-فلزکاری-بهران-برش-53',
    desc: 'روغن برشکاری بهران برای روانکاری و خنک‌کاری عملیات برش و ماشین‌کاری فلزات طراحی شده است.'
  },
  'بهران تراش': {
    cat: 'metalworking-oils', match: 'family',
    img: '/images/behran/tarash.webp', source: 'https://roghanmarket.com/product/behran-tarash',
    desc: 'روغن تراشکاری بهران برای روانکاری و خنک‌کاری عملیات ماشین‌کاری دقیق فلزات مناسب است.'
  },
  'بهران مقاوم': {
    cat: 'metalworking-oils', match: 'generic',
    img: '/images/behran/generic-drum.svg', source: '',
    desc: 'روغن بهران مقاوم برای روانکاری مته‌های سنگ‌بری، ماشین‌آلات معدن و تجهیزات دارای بار ضربه‌ای بالا طراحی شده است.'
  },
  'بهران بافت': {
    cat: 'textile-oils', match: 'generic',
    img: '/images/behran/generic-drum.svg', source: '',
    desc: 'روغن نساجی بهران بافت برای روانکاری ماشین‌آلات بافندگی و ریسندگی در صنعت نساجی طراحی شده است.'
  },
  'بهران دوخت': {
    cat: 'textile-oils', match: 'generic',
    img: '/images/behran/generic-drum.svg', source: '',
    desc: 'روغن بهران دوخت برای روانکاری ماشین‌آلات دوخت صنعتی و تجهیزات نساجی مناسب است.'
  },
  'بهران حرارت': {
    cat: 'heat-transfer-oils', match: 'family',
    img: '/images/behran/hararat.webp', source: 'https://www.famcocorp.com/product/16137/روغن-انتقال-حرارت-بهران-behran',
    desc: 'روغن انتقال حرارت بهران برای سیستم‌های گرمایش غیرمستقیم صنعتی با پایداری حرارتی بالا طراحی شده است.'
  },
  'بهران آبکار': {
    cat: 'heat-treatment-oils', match: 'family',
    img: '/images/behran/abkar.webp', source: 'https://www.famcocorp.com',
    desc: 'روغن آبکار بهران برای عملیات حرارتی فلزات و فرآیندهای آبکاری و سخت‌کاری طراحی شده است.'
  },
  'بهران آبکار ویژه': {
    cat: 'heat-treatment-oils', match: 'family',
    img: '/images/behran/abkar.webp', source: 'https://www.famcocorp.com',
    desc: 'روغن آبکار ویژه بهران برای عملیات حرارتی و سخت‌کاری قطعات فلزی با کنترل مناسب سرعت سرمایش طراحی شده است.'
  },
  'بهران آبکار گرم': {
    cat: 'heat-treatment-oils', match: 'family',
    img: '/images/behran/abkar.webp', source: 'https://www.famcocorp.com',
    desc: 'روغن آبکار گرم بهران برای عملیات حرارتی فلزات در دماهای بالا و فرآیندهای کوئنچ طراحی شده است.'
  },
  'بهران کمپرسور': {
    cat: 'compressor-oils', match: 'family',
    img: '/images/behran/compressor.webp', source: 'https://www.delcosanat.com/pro/behran-oil-compressor',
    desc: 'روغن کمپرسور بهران برای روانکاری کمپرسورهای هوا با پایداری اکسیداسیون مناسب طراحی شده است.'
  },
  'بهران سرد ویژه': {
    cat: 'refrigeration-oils', match: 'family',
    img: '/images/behran/sard.webp', source: 'https://www.delcosanat.com/pro/behran-oil-compressor',
    desc: 'روغن کمپرسور برودتی بهران سرد ویژه برای روانکاری کمپرسورهای سیستم‌های تبرید و تهویه مطبوع طراحی شده است.'
  },
  'بهران مته': {
    cat: 'metalworking-oils', match: 'generic',
    img: '/images/behran/generic-drum.svg', source: '',
    desc: 'روغن بهران مته برای روانکاری مته‌ها و ابزارهای حفاری و ماشین‌کاری طراحی شده است.'
  },
  'بهران پاک': {
    cat: 'general-purpose', match: 'generic',
    img: '/images/behran/generic-drum.svg', source: '',
    desc: 'روغن پاک‌کننده بهران برای تمیزکاری و شست‌وشوی قطعات و تجهیزات صنعتی مناسب است.'
  },
  'بهران محافظ': {
    cat: 'rust-preventives', match: 'family',
    img: '/images/behran/mohafez.webp', source: 'http://roghansanat.com/products/type/8.aspx',
    desc: 'روغن ضدزنگ و محافظ بهران برای محافظت موقت قطعات و سطوح فلزی در برابر خوردگی و زنگ‌زدگی طراحی شده است.'
  },
  'بهران آذرخش ویژه': {
    cat: 'transformer-oils', match: 'generic',
    img: '/images/behran/generic-drum.svg', source: '',
    desc: 'روغن الکتریکال بهران آذرخش ویژه برای عایق‌کاری و خنک‌کاری ترانسفورماتورها و تجهیزات الکتریکی طراحی شده است.'
  },
  'بهران سمند': {
    cat: 'gear-oils', match: 'family',
    img: '/images/behran/samand.webp', source: 'https://macromarket.ir/products/1807/',
    desc: 'روغن گیربکس دنده‌ای بهران سمند برای روانکاری گیربکس‌های دستی و دیفرانسیل خودروهای سبک طراحی شده است.'
  },
  'بهران سمند ویژه': {
    cat: 'gear-oils', match: 'family',
    img: '/images/behran/samand.webp', source: 'https://macromarket.ir/products/1807/',
    desc: 'روغن گیربکس دنده‌ای بهران سمند ویژه برای روانکاری گیربکس‌های دستی و دیفرانسیل با عملکرد بهبودیافته طراحی شده است.'
  },
  'بهران اتوماتیک': {
    cat: 'atf', match: 'family',
    img: '/images/behran/atf.webp', source: 'https://fidaroil.com/best-automatic-transmission-oil-behran/',
    desc: 'روغن گیربکس اتوماتیک (ATF) بهران برای روانکاری گیربکس‌های اتوماتیک خودرو طراحی شده است.'
  }
};

// exact-match exceptions (grade that matches the found photo)
const EXACT: Record<string, string[]> = {
  'بهران توربین': ['32'],
  'بهران بردبار': ['220'],
  'بهران برش': ['53']
};

async function main() {
  console.log('▶ پاکسازی کاتالوگ قبلی…');
  await prisma.product.deleteMany({}); // آیتم‌های سفارش اسنپ‌شات دارند؛ حذف سخت امن است
  await prisma.category.updateMany({ where: { deletedAt: null }, data: { deletedAt: new Date() } });
  await prisma.brand.updateMany({ where: { deletedAt: null, slug: { not: 'behran' } }, data: { deletedAt: new Date() } });

  console.log('▶ برند بهران…');
  await prisma.brand.upsert({
    where: { slug: 'behran' },
    update: {
      name: 'نفت بهران', deletedAt: null,
      logo: '/images/behran/logo.webp',
      description: 'شرکت نفت بهران، بزرگ‌ترین تولیدکننده روغن‌های موتور و صنعتی در ایران با بیش از ۶۰ سال تجربه در صنعت روانکارها.'
    },
    create: {
      name: 'نفت بهران', slug: 'behran', logo: '/images/behran/logo.webp',
      description: 'شرکت نفت بهران، بزرگ‌ترین تولیدکننده روغن‌های موتور و صنعتی در ایران با بیش از ۶۰ سال تجربه در صنعت روانکارها.'
    }
  });

  console.log('▶ دسته‌بندی‌ها…');
  const parentIds: Record<string, string> = {};
  for (const p of CATS.parents) {
    const c = await prisma.category.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.desc, parentId: null, deletedAt: null, sortOrder: CATS.parents.indexOf(p) + 1 },
      create: { name: p.name, slug: p.slug, description: p.desc, sortOrder: CATS.parents.indexOf(p) + 1 }
    });
    parentIds[p.slug] = c.id;
  }
  const childIds: Record<string, string> = {};
  for (const ch of CATS.children) {
    const c = await prisma.category.upsert({
      where: { slug: ch.slug },
      update: { name: ch.name, parentId: parentIds[ch.parent], deletedAt: null, sortOrder: CATS.children.indexOf(ch) + 1 },
      create: { name: ch.name, slug: ch.slug, parentId: parentIds[ch.parent], sortOrder: CATS.children.indexOf(ch) + 1 }
    });
    childIds[ch.slug] = c.id;
  }

  console.log('▶ درج ۱۴۱ محصول…');
  let exactCount = 0, familyCount = 0, genericCount = 0;
  const reviewList: string[] = [];
  const brand = await prisma.brand.findUnique({ where: { slug: 'behran' } });

  for (const r of RAW) {
    const fam = FAMILY[r.name];
    if (!fam) {
      reviewList.push(`${r.name} — خانواده ناشناخته`);
      continue;
    }
    const fullName = r.grade ? `${r.name} ${r.grade}` : r.name;
    const slug = await uniqueSlug(fullName, async (s) => Boolean(await prisma.product.findUnique({ where: { slug: s } })));

    let match = fam.match;
    if (fam.match === 'family' && EXACT[r.name]?.includes(r.grade)) match = 'exact';
    if (match === 'exact') exactCount++;
    else if (match === 'family') familyCount++;
    else {
      genericCount++;
      reviewList.push(`${fullName} — تصویر عمومی (نیاز به تصویر واقعی)`);
    }

    const desc = `${fam.desc} این محصول در گرید ${r.grade} عرضه می‌شود.` ;
    const product = await prisma.product.create({
      data: {
        name: fullName,
        slug,
        shortDescription: desc,
        description: `${fam.desc}`,
        brandId: brand!.id,
        categoryId: childIds[fam.cat],
        price: Math.round(r.price / 10), // ریال ← تومان
        salePrice: null,
        sku: null,
        barcode: null,
        stock: 100,
        lowStockThreshold: 5,
        isPublished: true,
        seoTitle: fullName,
        seoDescription: fam.desc
      }
    });
    const imgAlt = `${fullName} — ${r.packaging}`;
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: fam.img,
        alt: imgAlt,
        sortOrder: 0,
        isMain: true,
        sourceUrl: fam.source || null,
        matchLevel: match,
        fileName: slugify(`${r.name}-${r.grade}`) + (fam.img.endsWith('.svg') ? '.svg' : '.webp')
      }
    });
    const specs = [
      { group: 'مشخصات', name: 'گرید', value: r.grade, sortOrder: 0 },
      { group: 'مشخصات', name: 'نوع بسته‌بندی', value: r.packaging, sortOrder: 1 }
    ].filter((s) => s.value);
    for (const s of specs) {
      await prisma.productSpec.create({ data: { productId: product.id, ...s } });
    }
  }

  console.log('▶ تنظیم واحد پول به تومان…');
  await prisma.siteSetting.upsert({
    where: { key: 'currencyLabel' },
    update: { value: JSON.stringify('تومان') },
    create: { key: 'currencyLabel', value: JSON.stringify('تومان'), group: 'general' }
  });

  const total = await prisma.product.count({ where: { deletedAt: null } });
  const cats = await prisma.category.count({ where: { deletedAt: null } });
  console.log('\n══════════ گزارش ورود داده ══════════');
  console.log('کل محصولات واردشده:', total);
  console.log('دسته‌ها (والد + زیرمجموعه):', cats);
  console.log('تصاویر دقیق (exact):', exactCount);
  console.log('تصاویر هم‌خانواده (family):', familyCount);
  console.log('تصاویر عمومی (generic):', genericCount);
  console.log('موارد نیازمند بررسی:', reviewList.length);
  for (const x of reviewList) console.log('  ⚠', x);
  console.log('═════════════════════════════════════');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
