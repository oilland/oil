// ─────────────────────────────────────────────────────────────────────────────
//  Generate a unified, branded "packshot" SVG for every product and assign it.
//  Design system: category-colored gradient bg + metal container silhouette
//  (drum/pail/bottle/quart) + lime label band with the product grade.
//  Produces a consistent, premium catalog look across all 176 products.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

const DIR = 'public/images/products/branded';
fs.mkdirSync(DIR, { recursive: true });

const COLORS = {
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

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function container(type) {
  switch (type) {
    case 'drum':
      return `<g>
        <ellipse cx="400" cy="570" rx="140" ry="26" fill="#dbe3ec"/>
        <rect x="260" y="330" width="280" height="240" fill="url(#metal)"/>
        <ellipse cx="400" cy="330" rx="140" ry="26" fill="#ffffff"/>
        <ellipse cx="400" cy="330" rx="104" ry="17" fill="#9aa7b6"/>
        <rect x="260" y="398" width="280" height="11" rx="5.5" fill="#9aa7b6" opacity="0.55"/>
        <rect x="260" y="498" width="280" height="11" rx="5.5" fill="#9aa7b6" opacity="0.55"/>
      </g>`;
    case 'pail':
      return `<g>
        <path d="M300 330 L332 560 Q334 592 366 592 L434 592 Q466 592 468 560 L500 330 Z" fill="url(#metal)"/>
        <rect x="300" y="330" width="200" height="24" rx="10" fill="#e8edf3"/>
        <path d="M342 330 Q400 248 458 330" fill="none" stroke="#c7d1dd" stroke-width="15" stroke-linecap="round"/>
      </g>`;
    case 'quart':
      return `<g>
        <rect x="360" y="268" width="80" height="36" rx="7" fill="url(#metal)"/>
        <rect x="318" y="300" width="164" height="242" rx="18" fill="url(#metal)"/>
        <rect x="318" y="300" width="164" height="46" rx="18" fill="#e8edf3"/>
        <rect x="336" y="360" width="128" height="4" rx="2" fill="#9aa7b6" opacity="0.5"/>
        <rect x="336" y="380" width="128" height="4" rx="2" fill="#9aa7b6" opacity="0.5"/>
      </g>`;
    default: // bottle
      return `<g>
        <rect x="356" y="176" width="88" height="64" rx="10" fill="url(#metal)"/>
        <rect x="340" y="234" width="120" height="26" rx="10" fill="#e8edf3"/>
        <path d="M336 258 h128 v74 c0 18 -14 26 -30 26 h-68 c-16 0 -30 -8 -30 -26 Z" fill="url(#metal)"/>
        <rect x="336" y="332" width="128" height="216" rx="20" fill="url(#metal)"/>
      </g>`;
  }
}

function gradeFont(g) {
  const len = [...g].length;
  if (len <= 3) return 62;
  if (len <= 6) return 52;
  if (len <= 10) return 44;
  return 36;
}

function svg({ c1, c2, type, grade, catName }) {
  const fs_ = gradeFont(grade);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="45%" stop-color="#eef2f7"/>
      <stop offset="100%" stop-color="#cfd8e3"/>
    </linearGradient>
    <linearGradient id="label" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c8e549"/>
      <stop offset="100%" stop-color="#9cc32a"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="700" cy="110" r="230" fill="#ffffff" opacity="0.07"/>
  <circle cx="60" cy="740" r="200" fill="#000000" opacity="0.12"/>
  <text x="44" y="66" font-family="sans-serif" font-size="30" font-weight="700" fill="#ffffff" opacity="0.92">نفت بهران</text>
  <text x="44" y="756" font-family="sans-serif" font-size="23" fill="#ffffff" opacity="0.66">${esc(catName)}</text>
  ${container(type)}
  <rect x="248" y="410" width="304" height="98" rx="20" fill="url(#label)"/>
  <text x="400" y="473" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fs_}" font-weight="800" fill="#062e2b">${esc(grade)}</text>
</svg>`;
}

function containerType(packaging) {
  const p = packaging || '';
  if (p.includes('بشکه')) return 'drum';
  if (p.includes('کوارت')) return 'quart';
  if (p.includes('سطل') || p.includes('گالن')) return 'pail';
  return 'bottle';
}

const PACK_TOKENS = new Set([
  'بشکه', 'سطل', 'کوارت', 'گالن', 'لیتری', 'پلاستیکی', 'پلاستیک', 'فلزی',
  'لیتر', 'کیلویی', 'پنجاه', 'پنج', 'نیم', 'سه', 'چهار', 'یک', 'دو', 'دویست', 'هشت'
]);

function displayGrade(product, specs) {
  const g = specs.find((s) => s.name === 'گرید')?.value?.trim();
  if (g) return g;
  const base = product.name
    .replace(/^بهران\s+/, '')
    .split(' ')
    .filter((w) => !PACK_TOKENS.has(w) && !/^[\d۰-۹]+$/.test(w))
    .join(' ')
    .trim();
  return base || 'روغن بهران';
}

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      category: { select: { slug: true, name: true } },
      specs: { select: { name: true, value: true } },
      images: { select: { sourceUrl: true } }
    }
  });

  console.log('products:', products.length);

  let n = 0;
  for (const product of products) {
    const grade = displayGrade(product, product.specs);
    const packaging = product.specs.find((s) => s.name === 'نوع بسته‌بندی')?.value || '';
    const type = containerType(packaging);
    const [c1, c2] = COLORS[product.category?.slug] || ['#0f8270', '#062e2b'];
    const catName = product.category?.name || 'محصولات بهران';

    const svgText = svg({ c1, c2, type, grade, catName });
    const fileName = `${product.slug}.svg`;
    fs.writeFileSync(path.join(DIR, fileName), svgText, 'utf-8');

    const url = `/images/products/branded/${fileName}`;
    const oldSource = product.images[0]?.sourceUrl ?? null;

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url,
        alt: `${product.name} — گرید ${grade}`,
        sortOrder: 0,
        isMain: true,
        sourceUrl: oldSource,
        matchLevel: 'branded',
        fileName
      }
    });
    n++;
  }

  console.log('generated + assigned:', n, 'product images');
  console.log('directory:', DIR);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
