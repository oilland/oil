// Generates a fully self-contained, interactive HTML preview of the storefront
// (inline CSS/JS + base64 images/fonts) that opens in any browser without a server.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
const root = process.cwd();

const toB64 = (p) => {
  try {
    return fs.readFileSync(path.join(root, p)).toString('base64');
  } catch {
    return '';
  }
};
const imgB64 = (url) => {
  if (!url) return '';
  const m = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
  const p = path.join(root, 'public', url.replace(/^\/+/, ''));
  const ext = path.extname(p).toLowerCase();
  if (!toB64(p)) return '';
  return `data:${m[ext] || 'image/svg+xml'};base64,${toB64(p)}`;
};

const fontRegular = toB64('public/fonts/Vazirmatn-Regular.woff2');
const fontBold = toB64('public/fonts/Vazirmatn-Bold.woff2');

// ── data ─────────────────────────────────────────────────────────────
const settingRows = await prisma.siteSetting.findMany();
const settings = {};
for (const s of settingRows) {
  try { settings[s.key] = JSON.parse(s.value); } catch { settings[s.key] = s.value; }
}

const products = await prisma.product.findMany({
  where: { isPublished: true, deletedAt: null },
  orderBy: { createdAt: 'desc' },
  take: 12,
  include: {
    brand: true,
    images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    specs: { orderBy: { sortOrder: 'asc' }, take: 4 }
  }
});

const categories = await prisma.category.findMany({
  where: { deletedAt: null, parentId: null, isActive: true },
  orderBy: { sortOrder: 'asc' },
  take: 8
});

const brands = await prisma.brand.findMany({
  where: { deletedAt: null, isActive: true },
  orderBy: { name: 'asc' },
  take: 8
});

const banners = await prisma.banner.findMany({
  where: { isActive: true, section: 'hero' },
  orderBy: { sortOrder: 'asc' }
});

const testimonials = await prisma.testimonial.findMany({
  where: { isActive: true },
  orderBy: { sortOrder: 'asc' },
  take: 4
});

const compats = await prisma.productCompatibility.findMany({
  select: { productId: true, vehicleBrand: { select: { name: true } }, vehicleModel: { select: { name: true } } }
});
const compatMap = {};
for (const c of compats) {
  (compatMap[c.productId] = compatMap[c.productId] || { brands: new Set(), models: new Set() });
  if (c.vehicleBrand) compatMap[c.productId].brands.add(c.vehicleBrand.name);
  if (c.vehicleModel) compatMap[c.productId].models.add(c.vehicleModel.name);
}

const vehicleBrands = await prisma.vehicleBrand.findMany({
  orderBy: { name: 'asc' },
  include: { models: { orderBy: { name: 'asc' } } }
});

const storeName = settings.storeName || 'روغن‌لند';
const phone = settings.phone || '021-91000000';

const productJSON = products.map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  salePrice: p.salePrice,
  brand: p.brand?.name ?? '',
  img: imgB64(p.images[0]?.url) || imgB64('/images/placeholder.svg'),
  specs: p.specs.map((s) => [s.name, s.value]),
  brands: Array.from(compatMap[p.id]?.brands ?? []),
  models: Array.from(compatMap[p.id]?.models ?? [])
}));

const categoryJSON = categories.map((c) => ({ name: c.name, image: c.image ? imgB64(c.image) : '' }));
const brandJSON = brands.map((b) => ({ name: b.name, logo: imgB64(b.logo) }));
const bannerJSON = banners.map((b) => ({
  title: b.title ?? '',
  subtitle: b.subtitle ?? '',
  button: b.buttonText ?? '',
  url: b.url ?? '',
  img: imgB64(b.image)
}));
const testiJSON = testimonials.map((t) => ({ name: t.name, role: t.role, content: t.content, rating: t.rating }));
const vehJSON = vehicleBrands.map((b) => ({ name: b.name, models: b.models.map((m) => m.name) }));

const priceFmt = 'const fa=n=>String(n).replace(/\\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);const fmt=n=>Number(n).toLocaleString("fa-IR");';

const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${storeName} — پیش‌نمایش تعاملی فروشگاه</title>
<style>
@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,${fontRegular}) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,${fontBold}) format("woff2");font-weight:700;font-display:swap}
:root{--b600:#0f8270;--b700:#0c6b5e;--b800:#0b554d;--b900:#0a4740;--b950:#062e2b;--a400:#b7d73a;--a500:#9cc32a;--a600:#7a9b1d}
*{box-sizing:border-box}body{margin:0;font-family:Vazirmatn,Tahoma,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.7}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}
.demo-note{background:linear-gradient(90deg,#0f2350,#16387e);color:#cfe3ff;text-align:center;font-size:12px;padding:7px 12px}
.demo-note b{color:#fff}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}
/* header */
.topbar{background:linear-gradient(270deg,#0f2350,#1746a0);color:#dbeafe;font-size:12px}
.topbar .wrap{display:flex;justify-content:space-between;align-items:center;height:34px}
.hd{background:#fff;border-bottom:1px solid #eef2f7;position:sticky;top:0;z-index:50}
.hd .wrap{display:flex;align-items:center;gap:16px;height:68px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;color:#0f172a}
.logo img{height:40px;width:auto;display:block}
.logo .ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fed7aa;background:linear-gradient(135deg,#3389f5,#1746a0);box-shadow:0 6px 16px rgba(23,70,160,.3)}
.search{flex:1;max-width:520px;margin:0 auto;position:relative}
.search input{width:100%;height:44px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;padding:0 42px 0 14px;font-family:inherit;font-size:14px;outline:none}
.search input:focus{border-color:#1c6be8;background:#fff;box-shadow:0 0 0 3px rgba(28,107,232,.15)}
.search .ic{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#94a3b8}
.actions{display:flex;align-items:center;gap:4px}
.act{position:relative;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#475569;cursor:pointer}
.act:hover{background:#f1f5f9}
.badge-count{position:absolute;top:-2px;left:-2px;min-width:17px;height:17px;border-radius:9px;background:var(--b800);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px}
.badge-count.hidden{display:none}
.nav{display:flex;gap:4px;padding-bottom:12px;align-items:center;flex-wrap:wrap}
.nav a{padding:8px 14px;border-radius:12px;font-size:14px;font-weight:600;color:#334155;cursor:pointer}
.nav a:hover{background:#f1f5f9}
.nav a.hot{color:#dc2626}
.nav a.hot:hover{background:#fef2f2}
/* hero */
.hero{position:relative;overflow:hidden;border-radius:22px;margin-top:18px;box-shadow:0 8px 30px rgba(15,23,42,.12)}
.slides{display:flex;transition:transform .6s ease}
.slide{min-width:100%;position:relative;aspect-ratio:16/6}
.slide img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.slide .ov{position:absolute;inset:0;background:linear-gradient(270deg,rgba(0,0,0,.5),rgba(0,0,0,.12) 60%,transparent)}
.slide .tx{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:8px;padding:28px 48px;max-width:560px}
.slide h2{color:#fff;font-size:30px;font-weight:900;margin:0;line-height:1.4}
.slide p{color:#e2e8f0;font-size:15px;margin:0}
.slide .btn{display:inline-block;margin-top:10px;background:linear-gradient(270deg,#f97316,#ea580c);color:#fff;padding:12px 26px;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 6px 16px rgba(234,88,12,.35)}
.dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px}
.dots span{width:8px;height:8px;border-radius:6px;background:rgba(255,255,255,.5);cursor:pointer;transition:.3s}
.dots span.on{width:22px;background:#fff}
/* sections */
.sec{padding:44px 0}
.sec-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
.sec-head h2{font-size:21px;font-weight:800;margin:0;color:#0f172a}
.sec-head p{color:#94a3b8;font-size:13px;margin:4px 0 0}
.cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
.cat{background:#fff;border:1px solid #e8eef6;border-radius:16px;padding:18px 10px;text-align:center;cursor:pointer;transition:.2s;box-shadow:0 1px 3px rgba(15,23,42,.05)}
.cat:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(15,23,42,.12);border-color:#bcdfff}
.cat .sq{width:52px;height:52px;border-radius:14px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:19px;font-weight:800;box-shadow:0 6px 14px rgba(15,23,42,.18)}
.cat .sq-img{width:100%;aspect-ratio:1/1;border-radius:12px;margin:0 auto 10px;display:block;object-fit:cover;box-shadow:0 6px 14px rgba(15,23,42,.14)}
.cat span{font-size:13px;font-weight:700;color:#334155}
/* toolbar */
.toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;background:#fff;border:1px solid #e8eef6;border-radius:16px;padding:12px 14px;margin-bottom:20px}
.toolbar select{height:40px;border-radius:11px;border:1px solid #e2e8f0;background:#f8fafc;padding:0 12px;font-family:inherit;font-size:13px;color:#334155;outline:none}
.chip{padding:8px 14px;border-radius:11px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#475569;cursor:pointer;font-family:inherit}
.chip.on{background:var(--b800);border-color:var(--b800);color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
.pcard{background:#fff;border:1px solid #e8eef6;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;transition:.25s;box-shadow:0 1px 3px rgba(15,23,42,.05);position:relative}
.pcard:hover{transform:translateY(-4px);box-shadow:0 14px 34px rgba(15,23,42,.14)}
.pcard .ph{position:relative;aspect-ratio:1/1;background:#f1f5f9;cursor:pointer}
.pcard .ph img{width:100%;height:100%;object-fit:cover;transition:.5s}
.pcard:hover .ph img{transform:scale(1.05)}
.pcard .tags{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:6px}
.tag{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px}
.tag.disc{background:#fee2e2;color:#dc2626}
.tag.best{background:var(--b800);color:#fff}
.wish{position:absolute;top:10px;left:10px;width:34px;height:34px;border-radius:10px;background:#fff;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;color:#cbd5e1;cursor:pointer;transition:.2s;font-size:17px}
.wish.active{color:#ef4444;border-color:#fecaca;background:#fef2f2}
.pcard .bd{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}
.pcard .br{font-size:12px;color:var(--b600);font-weight:700}
.pcard .nm{font-size:13.5px;font-weight:700;color:#1e293b;line-height:1.8;min-height:48px;cursor:pointer}
.pcard .nm:hover{color:var(--b700)}
.pcard .pr{display:flex;align-items:baseline;gap:8px;margin-top:auto}
.pcard .pr .now{font-size:16px;font-weight:800;color:#0f172a}
.pcard .pr .now small{font-size:11px;color:#94a3b8;font-weight:500}
.pcard .pr .old{font-size:12px;color:#cbd5e1;text-decoration:line-through}
.pcard .row{display:flex;gap:8px;margin-top:4px}
.add{flex:1;padding:9px;border:none;border-radius:11px;background:linear-gradient(270deg,#1c6be8,#1746a0);color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(23,70,160,.25)}
.add:hover{filter:brightness(1.07)}
.qv{padding:9px 12px;border-radius:11px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer}
.qv:hover{background:#f8fafc}
/* vehicle */
.veh{background:linear-gradient(270deg,#0f2350,#16387e 55%,#1c6be8);border-radius:22px;padding:44px 28px;color:#fff;text-align:center}
.veh h2{font-size:24px;font-weight:900;margin:0}
.veh .sub{color:#cbd5e1;font-size:14px;margin:8px 0 24px}
.veh .box{max-width:640px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.veh select{height:48px;border-radius:13px;border:none;padding:0 14px;font-family:inherit;font-size:14px;color:#334155;outline:none}
.veh .find{grid-column:1/-1;height:48px;border:none;border-radius:13px;background:linear-gradient(270deg,#f97316,#ea580c);color:#fff;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer}
/* brands */
.brands{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}
.brand{background:#fff;border:1px solid #e8eef6;border-radius:14px;padding:14px;display:flex;align-items:center;justify-content:center;height:64px}
.brand img{max-height:34px;width:auto}
/* testimonials */
.testi{background:linear-gradient(135deg,#0f2350,#16387e);color:#e2e8f0}
.testi .grid4{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.tcard{background:rgba(255,255,255,.06);border-radius:16px;padding:22px;backdrop-filter:blur(4px)}
.tcard .st{color:#fb923c;font-size:14px;letter-spacing:2px}
.tcard p{font-size:13.5px;line-height:2;color:#cbd5e1;margin:12px 0}
.tcard .who{display:flex;align-items:center;gap:10px}
.tcard .av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
.tcard b{display:block;color:#fff;font-size:13px}
.tcard .role{font-size:11px;color:#94a3b8}
/* footer */
.footer{background:linear-gradient(180deg,#0f2350,#0a1a36);color:#cbd5e1;margin-top:40px}
.footer .wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px;padding-top:40px;padding-bottom:40px}
.footer h4{color:#fff;font-size:14px;margin:0 0 14px}
.footer a{display:block;color:#94a3b8;font-size:13px;padding:4px 0}
.footer a:hover{color:#fbbf24}
.footer .copy{border-top:1px solid rgba(255,255,255,.1);text-align:center;font-size:12px;color:#64748b;padding:16px}
/* modal */
.modal{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;z-index:100;padding:20px}
.modal.open{display:flex}
.modal .m{background:#fff;border-radius:20px;max-width:820px;width:100%;max-height:90vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr}
.modal .m img{width:100%;height:100%;object-fit:cover}
.modal .d{padding:26px}
.modal .d h3{margin:0 0 6px;font-size:18px;font-weight:800}
.modal .d .br{color:var(--b600);font-size:13px;font-weight:700}
.modal table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}
.modal table td{padding:9px 12px;border-bottom:1px solid #f1f5f9}
.modal table td:first-child{color:#94a3b8;width:45%}
.modal table td:last-child{font-weight:700}
.modal .close{position:absolute;top:14px;left:14px;width:34px;height:34px;border-radius:10px;background:#fff;border:1px solid #e2e8f0;cursor:pointer;font-size:16px;color:#475569}
.modal .price-now{font-size:22px;font-weight:900;color:var(--b800)}
/* toast */
.toast{position:fixed;bottom:24px;right:50%;transform:translateX(50%) translateY(80px);background:#065f46;color:#fff;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:600;transition:.35s;opacity:0;z-index:200;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.toast.show{transform:translateX(50%) translateY(0);opacity:1}
/* burger */
.burger{display:none;width:40px;height:40px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;align-items:center;justify-content:center;flex-direction:column;gap:4px;cursor:pointer}
.burger span{width:18px;height:2px;background:#334155;border-radius:2px}
.mmenu{display:none;background:#fff;border-top:1px solid #eef2f7;padding:12px 20px}
.mmenu.open{display:block}
.mmenu a{display:block;padding:11px 4px;font-size:14px;font-weight:600;color:#334155;border-bottom:1px solid #f8fafc}
@media(max-width:860px){.search{display:none}.burger{display:flex}.nav{display:none}.slide h2{font-size:22px}.slide .tx{padding:18px 22px}.modal .m{grid-template-columns:1fr}.modal .m img{max-height:260px}.veh .box{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="demo-note">این یک <b>پیش‌نمایش استاتیک تعاملی</b> است (قابل دانلود و باز شدن در هر مرورگر) — نسخهٔ زندهٔ کامل با پنل مدیریت در Live Preview محیط Arena در دسترس است.</div>

<header>
  <div class="topbar"><div class="wrap"><span>☎ <bdi>${phone}</bdi></span><span>⚡ ارسال سریع به سراسر کشور · ضمانت اصالت کالا</span></div></div>
  <div class="hd"><div class="wrap">
    <button class="burger" onclick="document.getElementById('mmenu').classList.toggle('open')"><span></span><span></span><span></span></button>
    <a class="logo"><img src="${imgB64('/images/logo.png')}" alt="${storeName}"/></a>
    <div class="search"><span class="ic">🔍</span><input id="q" placeholder="جستجوی روغن موتور، برند، گرانروی…" oninput="applyFilters()"/></div>
    <div class="actions">
      <span class="act" title="ورود">👤</span>
      <span class="act" title="علاقه‌مندی‌ها">♡</span>
      <span class="act" title="سبد خرید">🛒<span class="badge-count hidden" id="cartCount">۰</span></span>
    </div>
  </div></div>
  <nav class="nav wrap" id="mmenu">
    <a>دسته‌بندی‌ها</a><a>همه محصولات</a><a class="hot">تخفیف‌ها</a><a>انتخاب روغن خودرو</a><a>وبلاگ</a><a>تماس با ما</a>
  </nav>
</header>

<div class="wrap">
  <div class="hero">
    <div class="slides" id="slides">
      ${bannerJSON.map((b, i) => `<div class="slide"><img src="${b.img}" alt=""/><div class="ov"></div><div class="tx"><h2>${b.title}</h2><p>${b.subtitle}</p>${b.button ? `<a class="btn">${b.button}</a>` : ''}</div></div>`).join('')}
    </div>
    <div class="dots" id="dots">${bannerJSON.map((_, i) => `<span class="${i === 0 ? 'on' : ''}" onclick="goSlide(${i})"></span>`).join('')}</div>
  </div>

  <section class="sec" id="cats-sec">
    <div class="sec-head"><div><h2>دسته‌بندی محصولات</h2><p>انتخاب بر اساس نیاز خودروی شما</p></div></div>
    <div class="cats" id="cats">${categoryJSON.map((c) => `<div class="cat" onclick="setCat('${c.name}')">${c.image ? `<img class="sq-img" src="${c.image}" alt="${c.name}"/>` : `<div class="sq">${c.name.slice(0, 1)}</div>`}<span>${c.name}</span></div>`).join('')}</div>
  </section>

  <section class="sec" id="products-sec">
    <div class="sec-head"><div><h2>محصولات</h2><p id="resultCount"></p></div></div>
    <div class="toolbar">
      <select id="sort" onchange="applyFilters()"><option value="">مرتب‌سازی: جدیدترین</option><option value="cheap">ارزان‌ترین</option><option value="exp">گران‌ترین</option></select>
      <select id="vbrand" onchange="fillModels()"><option value="">انتخاب برند خودرو…</option>${vehJSON.map((v) => `<option value="${v.name}">${v.name}</option>`).join('')}</select>
      <select id="vmodel" onchange="applyFilters()"><option value="">مدل خودرو…</option></select>
      <button class="chip" onclick="clearFilters()">✕ حذف فیلترها</button>
    </div>
    <div class="grid" id="grid"></div>
  </section>

  <section class="sec">
    <div class="veh">
      <h2>روغن مناسب خودروی خود را پیدا کنید</h2>
      <p class="sub">برند و مدل خودرو را انتخاب کنید تا محصولات سازگار نمایش داده شوند</p>
      <div class="box">
        <select id="vbrand2" onchange="fillModels2()"><option value="">برند خودرو</option>${vehJSON.map((v) => `<option value="${v.name}">${v.name}</option>`).join('')}</select>
        <select id="vmodel2" onchange="goVehicle()"><option value="">مدل</option></select>
        <button class="find" onclick="goVehicle()">🔍 نمایش محصولات سازگار</button>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><div><h2>برندهای معتبر</h2><p>همکاری با معتبرترین تولیدکنندگان</p></div></div>
    <div class="brands">${brandJSON.map((b) => `<div class="brand">${b.logo ? `<img src="${b.logo}" alt="${b.name}"/>` : `<b>${b.name}</b>`}</div>`).join('')}</div>
  </section>
</div>

<section class="sec testi">
  <div class="wrap">
    <div class="sec-head" style="color:#fff"><div><h2 style="color:#fff">نظرات مشتریان</h2><p style="color:#94a3b8">اعتماد شما سرمایه ماست</p></div></div>
    <div class="grid4">${testiJSON.map((t) => `<div class="tcard"><div class="st">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div><p>«${t.content}»</p><div class="who"><span class="av">${t.name.slice(0, 1)}</span><div><b>${t.name}</b><span class="role">${t.role || ''}</span></div></div></div>`).join('')}</div>
  </div>
</section>

<footer class="footer">
  <div class="wrap">
    <div><h4>${storeName}</h4><p style="font-size:13px;color:#94a3b8;line-height:2">فروشگاه تخصصی روغن موتور و روانکار خودرو با ضمانت اصالت کالا و مشاوره تخصصی رایگان.</p></div>
    <div><h4>دسترسی سریع</h4><a>همه محصولات</a><a>تخفیف‌های ویژه</a><a>انتخاب روغن خودرو</a><a>وبلاگ</a></div>
    <div><h4>دسته‌بندی‌ها</h4>${categoryJSON.slice(0, 5).map((c) => `<a>${c}</a>`).join('')}</div>
    <div><h4>تماس با ما</h4><a>📞 <bdi>${phone}</bdi></a><a>✉️ info@example.com</a><a>📍 تهران، خیابان ولیعصر</a></div>
  </div>
  <div class="copy">© ${new Date().getFullYear()} ${storeName} — تمامی حقوق محفوظ است.</div>
</footer>

<div class="modal" id="modal"><div class="m">
  <img id="mImg" src="" alt=""/>
  <div class="d"><button class="close" onclick="closeModal()">✕</button><span class="br" id="mBrand"></span><h3 id="mName"></h3>
    <div id="mPrice"></div>
    <table id="mSpecs"></table>
    <button class="add" style="width:100%;padding:12px" onclick="addToCart()">🛒 افزودن به سبد خرید</button>
  </div>
</div></div>

<div class="toast" id="toast">به سبد خرید اضافه شد ✓</div>

<script>
${priceFmt}
const PRODUCTS = ${JSON.stringify(productJSON)};
let cart = 0, cat = '', vbrand = '', vmodel = '', q = '', sort = '';

function toFa(s){return fa(s)}
function card(p, i){
  const disc = p.salePrice && p.salePrice < p.price ? Math.round((p.price - p.salePrice)/p.price*100) : 0;
  const now = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
  return '<div class="pcard" data-brand="' + p.brand + '" data-name="' + p.name + '" data-price="' + now + '" data-vb="' + p.brands.join('|') + '" data-vm="' + p.models.join('|') + '">'
    + '<div class="ph" onclick="openModal(' + i + ')"><img loading="lazy" src="' + p.img + '" alt=""/><div class="tags">'
    + (disc ? '<span class="tag disc">٪' + fa(disc) + '</span>' : '')
    + (i < 4 ? '<span class="tag best">پرفروش</span>' : '')
    + '</div><span class="wish" onclick="event.stopPropagation();toggleWish(this)">♥</span></div>'
    + '<div class="bd"><div class="br">' + p.brand + '</div><div class="nm" onclick="openModal(' + i + ')">' + p.name + '</div>'
    + '<div class="pr"><span class="now">' + fmt(now) + ' <small>تومان</small></span>'
    + (disc ? '<span class="old">' + fmt(p.price) + '</span>' : '')
    + '</div><div class="row"><button class="add" onclick="addToCart()">افزودن به سبد</button><button class="qv" onclick="openModal(' + i + ')">جزئیات</button></div></div></div>';
}
function render(){
  let list = PRODUCTS.slice();
  if (q) list = list.filter(p => p.name.indexOf(q) > -1 || p.brand.indexOf(q) > -1);
  if (cat) list = list.filter(p => p.name.indexOf(cat) > -1 || p.brand.indexOf(cat) > -1);
  if (vbrand) list = list.filter(p => p.brands.indexOf(vbrand) > -1);
  if (vmodel) list = list.filter(p => p.models.indexOf(vmodel) > -1);
  if (sort === 'cheap') list.sort((a,b) => a.price - b.price);
  if (sort === 'exp') list.sort((a,b) => b.price - a.price);
  document.getElementById('resultCount').textContent = fa(list.length) + ' محصول یافت شد';
  document.getElementById('grid').innerHTML = list.map((p,i) => card(p, PRODUCTS.indexOf(p))).join('') || '<p style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:40px">محصولی یافت نشد — فیلترها را تغییر دهید.</p>';
}
function applyFilters(){
  q = document.getElementById('q').value.trim();
  sort = document.getElementById('sort').value;
  vbrand = document.getElementById('vbrand').value;
  vmodel = document.getElementById('vmodel').value;
  render();
}
function setCat(c){ cat = (cat === c) ? '' : c; applyFilters(); }
function clearFilters(){ cat=''; vbrand=''; vmodel=''; q=''; document.getElementById('q').value=''; document.getElementById('sort').value=''; document.getElementById('vbrand').value=''; document.getElementById('vmodel').value=''; applyFilters(); }
function fillModels(){ vbrand = document.getElementById('vbrand').value; const sel = document.getElementById('vmodel'); sel.innerHTML = '<option value="">مدل خودرو…</option>'; const vb = VEHICLES.find(v => v.name === vbrand); if (vb) vb.models.forEach(m => sel.innerHTML += '<option value="' + m + '">' + m + '</option>'); applyFilters(); }
function fillModels2(){ const b = document.getElementById('vbrand2').value; const sel = document.getElementById('vmodel2'); sel.innerHTML = '<option value="">مدل</option>'; const vb = VEHICLES.find(v => v.name === b); if (vb) vb.models.forEach(m => sel.innerHTML += '<option value="' + m + '">' + m + '</option>'); }
function goVehicle(){ document.getElementById('vbrand').value = document.getElementById('vbrand2').value; fillModels(); document.getElementById('vmodel').value = document.getElementById('vmodel2').value; applyFilters(); document.getElementById('products-sec').scrollIntoView({behavior:'smooth'}); }
function addToCart(){ cart++; const el = document.getElementById('cartCount'); el.textContent = fa(cart); el.classList.remove('hidden'); showToast(); }
function toggleWish(el){ el.classList.toggle('active'); }
function showToast(){ const t = document.getElementById('toast'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600); }
let mIdx = 0;
function openModal(i){ mIdx = i; const p = PRODUCTS[i]; const now = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price; document.getElementById('mImg').src = p.img; document.getElementById('mBrand').textContent = p.brand; document.getElementById('mName').textContent = p.name; document.getElementById('mPrice').innerHTML = '<span class="price-now">' + fmt(now) + ' تومان</span>'; document.getElementById('mSpecs').innerHTML = p.specs.map(s => '<tr><td>' + s[0] + '</td><td>' + s[1] + '</td></tr>').join(''); document.getElementById('modal').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(){ document.getElementById('modal').classList.remove('open'); document.body.style.overflow = ''; }
document.getElementById('modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
// hero slider
let cur = 0; const N = ${bannerJSON.length};
function goSlide(i){ cur = (i + N) % N; document.getElementById('slides').style.transform = 'translateX(' + (cur * 100) + '%)'; document.querySelectorAll('#dots span').forEach((d, j) => d.classList.toggle('on', j === cur)); }
if (N > 1) setInterval(() => goSlide(cur + 1), 5500);
const VEHICLES = ${JSON.stringify(vehJSON)};
render();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(root, '..', 'preview-interactive.html'), html);
console.log('OK — preview-interactive.html', Math.round(html.length / 1024) + ' KB', '| products:', products.length, '| banners:', banners.length);
await prisma.$disconnect();
