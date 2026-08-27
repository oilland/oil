// ─────────────────────────────────────────────────────────────────────────────
//  SEO Autopilot — one call does everything:
//   1) audit  2) auto-fix fixable issues  3) generate a fresh blog article
//   4) persist a full markdown report (downloadable from the admin panel)
//  mode = 'review' → new article saved as DRAFT for admin approval
//  mode = 'auto'   → new article PUBLISHED immediately
// ─────────────────────────────────────────────────────────────────────────────
import { prisma } from '../db';
import { setSetting, getSettings } from '../settings';
import { uniqueSlug } from '../slug';
import { runSeoAudit, type SeoAudit } from './analyzer';
import { aiChat, aiAvailable, parseAiJson } from './ai';

export type AutopilotMode = 'review' | 'auto';

export interface AutopilotResult {
  ok: boolean;
  mode: AutopilotMode;
  usedAi: boolean;
  scoreBefore: number;
  scoreAfter: number;
  fixed: { productSeo: number; productDesc: number; postSeo: number; pageSeo: number };
  post: { title: string; slug: string; status: string } | null;
  reportMarkdown: string;
  finishedAt: string;
}

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const clamp = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

// ── 1) product meta fix (template — fast & deterministic for bulk) ──────────
async function fixProductSeo(storeName: string): Promise<number> {
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null, isPublished: true,
      OR: [{ seoTitle: null }, { seoTitle: '' }, { seoDescription: null }, { seoDescription: '' }]
    },
    select: { id: true, name: true, seoTitle: true, seoDescription: true, shortDescription: true, description: true, price: true, specs: { select: { name: true, value: true }, take: 3 } }
  });
  for (const p of products) {
    const seoTitle = p.seoTitle?.trim() || clamp(`خرید ${p.name} | قیمت و مشخصات | ${storeName}`, 65);
    const base = p.shortDescription?.trim() || strip(p.description || '');
    const specTxt = p.specs.map((s) => `${s.name}: ${s.value}`).join('، ');
    const seoDescription =
      p.seoDescription?.trim() ||
      clamp(base ? `${base} — خرید اینترنتی با ضمانت اصالت از ${storeName}.` : `خرید ${p.name} با بهترین قیمت و ضمانت اصالت کالا. ${specTxt ? specTxt + '. ' : ''}ارسال سریع به سراسر کشور از ${storeName}.`, 160);
    await prisma.product.update({ where: { id: p.id }, data: { seoTitle, seoDescription } });
  }
  return products.length;
}

// ── 2) thin product descriptions (template built from specs) ────────────────
async function fixThinDescriptions(storeName: string): Promise<number> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isPublished: true },
    select: {
      id: true, name: true, description: true, shortDescription: true,
      category: { select: { name: true } }, brand: { select: { name: true } },
      specs: { select: { name: true, value: true } }
    }
  });
  let n = 0;
  for (const p of products) {
    if (strip(p.description || '').length >= 200) continue;
    const cat = p.category?.name || 'روانکار';
    const brand = p.brand?.name || 'بهران';
    const specRows = p.specs.map((s) => `<li><b>${s.name}:</b> ${s.value}</li>`).join('');
    const intro = p.shortDescription?.trim() || `${p.name} یکی از محصولات باکیفیت ${brand} در دسته ${cat} است.`;
    const html =
      `<p>${intro}</p>` +
      `<p>این محصول با رعایت استانداردهای روز تولید شده و برای مصارف حرفه‌ای و صنعتی انتخابی مطمئن است. استفاده از روانکار مناسب، عمر تجهیزات را افزایش می‌دهد و هزینه‌های نگهداری را به‌طور محسوسی کاهش می‌دهد.</p>` +
      (specRows ? `<h3>مشخصات فنی</h3><ul>${specRows}</ul>` : '') +
      `<h3>چرا از ${storeName} بخریم؟</h3><ul><li>ضمانت اصالت کالا</li><li>ارسال سریع به سراسر کشور</li><li>مشاوره تخصصی رایگان پیش از خرید</li></ul>`;
    await prisma.product.update({ where: { id: p.id }, data: { description: html } });
    n += 1;
  }
  return n;
}

// ── 3) blog & page meta fix ──────────────────────────────────────────────────
async function fixPostSeo(storeName: string): Promise<number> {
  const posts = await prisma.blogPost.findMany({
    where: { OR: [{ seoTitle: null }, { seoTitle: '' }, { seoDescription: null }, { seoDescription: '' }] },
    select: { id: true, title: true, excerpt: true, content: true, seoTitle: true, seoDescription: true }
  });
  for (const p of posts) {
    await prisma.blogPost.update({
      where: { id: p.id },
      data: {
        seoTitle: p.seoTitle?.trim() || clamp(`${p.title} | ${storeName}`, 65),
        seoDescription: p.seoDescription?.trim() || clamp(p.excerpt?.trim() || strip(p.content), 160)
      }
    });
  }
  return posts.length;
}

async function fixPageSeo(storeName: string): Promise<number> {
  const pages = await prisma.page.findMany({
    where: { OR: [{ seoTitle: null }, { seoTitle: '' }, { seoDescription: null }, { seoDescription: '' }] },
    select: { id: true, title: true, content: true, seoTitle: true, seoDescription: true }
  });
  for (const p of pages) {
    await prisma.page.update({
      where: { id: p.id },
      data: {
        seoTitle: p.seoTitle?.trim() || clamp(`${p.title} | ${storeName}`, 65),
        seoDescription: p.seoDescription?.trim() || clamp(strip(p.content), 160)
      }
    });
  }
  return pages.length;
}

// ── 4) blog article generation ───────────────────────────────────────────────
const TOPIC_POOL = [
  'راهنمای کامل انتخاب روغن موتور مناسب خودرو',
  'روغن هیدرولیک چیست و چگونه روغن هیدرولیک مناسب انتخاب کنیم؟',
  'تفاوت روغن موتور بنزینی و دیزلی — اشتباهی که موتور را نابود می‌کند',
  'گرید روغن موتور (10W-40 و 20W-50) یعنی چه؟ راهنمای خواندن گرید',
  'زمان مناسب تعویض روغن موتور — نشانه‌ها و جدول کارکرد',
  'روغن گیربکس اتوماتیک (ATF) — انواع، کاربرد و زمان تعویض',
  'بهترین روغن‌های کمپرسور صنعتی و معیارهای انتخاب',
  'روغن توربین چیست؟ کاربرد و ویژگی‌های کلیدی',
  'راهنمای روانکاری تراکتور و ماشین‌آلات کشاورزی',
  'روغن ترانسفورماتور و نقش آن در تجهیزات برقی',
  'نگهداری از موتور خودرو در فصل سرما — نقش روغن مناسب',
  'روغن‌های فلزکاری و برش — راهنمای انتخاب برای کارگاه‌ها'
];

interface GeneratedPost { title: string; excerpt: string; contentHtml: string; seoTitle: string; seoDescription: string; tags: string; }

async function pickTopic(): Promise<string> {
  const existing = await prisma.blogPost.findMany({ select: { title: true } });
  const titles = new Set(existing.map((p) => p.title.trim()));
  return TOPIC_POOL.find((t) => !titles.has(t)) || `${TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)]} (نسخه به‌روز ${new Date().toLocaleDateString('fa-IR')})`;
}

async function composeArticle(topic: string, storeName: string): Promise<{ post: GeneratedPost; usedAi: boolean }> {
  // context: a few real products to link to
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isPublished: true },
    select: { name: true, slug: true, price: true, category: { select: { name: true } } },
    orderBy: { ratingCount: 'desc' },
    take: 6
  });
  const productCtx = products.map((p) => `- ${p.name} (لینک: /products/${p.slug})`).join('\n');

  // Try AI first
  const raw = await aiChat(
    `تو یک متخصص سئو و تولید محتوای فارسی برای فروشگاه اینترنتی روغن و روانکار «${storeName}» هستی. خروجی را فقط به‌صورت JSON بده با کلیدهای: title, excerpt, contentHtml, seoTitle (حداکثر ۶۵ کاراکتر), seoDescription (حداکثر ۱۶۰ کاراکتر), tags (با کاما جدا شده). contentHtml باید HTML تمیز با h2/h3/p/ul باشد، حداقل ۷۰۰ کلمه، لحن تخصصی اما روان، و در صورت مرتبط بودن به این محصولات با تگ <a href="..."> لینک بده:\n${productCtx}`,
    `یک مقاله وبلاگ کامل و سئوشده درباره «${topic}» بنویس. کلمه کلیدی اصلی را در عنوان، پاراگراف اول و حداقل یک h2 بیاور.`,
    3500
  );
  const ai = parseAiJson<Partial<GeneratedPost>>(raw);
  if (ai?.title && ai.contentHtml) {
    return {
      usedAi: true,
      post: {
        title: ai.title,
        excerpt: ai.excerpt || clamp(strip(ai.contentHtml), 180),
        contentHtml: ai.contentHtml,
        seoTitle: clamp(ai.seoTitle || `${ai.title} | ${storeName}`, 65),
        seoDescription: clamp(ai.seoDescription || strip(ai.contentHtml), 160),
        tags: ai.tags || 'روغن موتور,روانکار,راهنمای خرید'
      }
    };
  }

  // Template fallback (no API key / AI failure) — still a solid, structured article
  const links = products
    .slice(0, 4)
    .map((p) => `<li><a href="/products/${p.slug}">${p.name}</a>${p.category ? ` — دسته ${p.category.name}` : ''}</li>`)
    .join('');
  const contentHtml =
    `<p>${topic} یکی از پرتکرارترین سوالات مشتریان ماست. در این راهنما از ${storeName}، به زبان ساده و بر اساس تجربه فنی، همه نکاتی را که باید بدانید مرور می‌کنیم تا انتخابی مطمئن داشته باشید.</p>` +
    `<h2>چرا انتخاب روانکار مناسب مهم است؟</h2>` +
    `<p>روانکار مناسب اصطکاک را کاهش می‌دهد، دمای کارکرد را کنترل می‌کند و از فرسایش زودهنگام قطعات جلوگیری می‌کند. انتخاب اشتباه — حتی یک گرید نامناسب — می‌تواند عمر موتور یا تجهیزات صنعتی شما را به‌طور جدی کوتاه کند و هزینه‌های تعمیر سنگینی به همراه داشته باشد.</p>` +
    `<h2>معیارهای کلیدی انتخاب</h2>` +
    `<ul><li><b>گرید ویسکوزیته:</b> مطابق دفترچه راهنمای دستگاه یا خودرو انتخاب کنید.</li>` +
    `<li><b>سطح کیفیت (API/ACEA):</b> هرچه سطح بالاتر، محافظت بهتر.</li>` +
    `<li><b>شرایط کارکرد:</b> دمای محیط، بار کاری و کارکرد مداوم را در نظر بگیرید.</li>` +
    `<li><b>اصالت کالا:</b> فقط از فروشگاه معتبر با ضمانت اصالت خرید کنید.</li></ul>` +
    `<h2>محصولات پیشنهادی ${storeName}</h2>` +
    `<p>بر اساس بازخورد مشتریان، این محصولات پرفروش‌ترین انتخاب‌ها هستند:</p><ul>${links}</ul>` +
    `<h2>جمع‌بندی</h2>` +
    `<p>اگر هنوز مطمئن نیستید کدام محصول برای شما مناسب است، کارشناسان ${storeName} به‌صورت رایگان راهنمایی‌تان می‌کنند. همین حالا از طریق صفحه تماس با ما در ارتباط باشید یا از <a href="/products">فروشگاه</a> دیدن کنید.</p>`;
  return {
    usedAi: false,
    post: {
      title: topic,
      excerpt: clamp(`راهنمای کامل ${topic} — معیارهای انتخاب، اشتباهات رایج و محصولات پیشنهادی ${storeName}.`, 180),
      contentHtml,
      seoTitle: clamp(`${topic} | ${storeName}`, 65),
      seoDescription: clamp(`${topic}: راهنمای تخصصی ${storeName} با معیارهای انتخاب، نکات فنی و معرفی بهترین محصولات. مشاوره رایگان و ضمانت اصالت کالا.`, 160),
      tags: 'روغن موتور,روانکار,راهنمای خرید,بهران'
    }
  };
}

export async function createGeneratedPost(topic: string | null, mode: AutopilotMode, authorId?: string) {
  const settings = await getSettings();
  const storeName = String(settings.storeName || 'روغن‌لند');
  const finalTopic = topic?.trim() || (await pickTopic());
  const { post, usedAi } = await composeArticle(finalTopic, storeName);

  let category = await prisma.blogCategory.findFirst({ where: { slug: 'guides' } });
  if (!category) {
    category = await prisma.blogCategory.findFirst();
  }
  const slug = await uniqueSlug(post.title, async (s) => Boolean(await prisma.blogPost.findUnique({ where: { slug: s } })));
  const created = await prisma.blogPost.create({
    data: {
      title: post.title,
      slug,
      excerpt: post.excerpt,
      content: post.contentHtml,
      categoryId: category?.id ?? null,
      authorId: authorId ?? null,
      tags: post.tags,
      status: mode === 'auto' ? 'published' : 'draft',
      publishedAt: mode === 'auto' ? new Date() : null,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription
    }
  });
  return { created, usedAi };
}

// ── Report ───────────────────────────────────────────────────────────────────
function buildReport(a: {
  mode: AutopilotMode; usedAi: boolean; before: SeoAudit; after: SeoAudit;
  fixed: AutopilotResult['fixed']; post: AutopilotResult['post'];
}): string {
  const fa = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date());
  const lines: string[] = [
    `# 📈 گزارش دستیار سئو — روغن‌لند`,
    ``,
    `- **زمان اجرا:** ${fa}`,
    `- **حالت:** ${a.mode === 'auto' ? 'تمام‌خودکار (انتشار مستقیم)' : 'بازبینی مدیر (پیش‌نویس)'}`,
    `- **موتور محتوا:** ${a.usedAi ? 'هوش مصنوعی (API متصل)' : 'قالب هوشمند داخلی (بدون کلید API)'}`,
    `- **امتیاز سئو:** ${a.before.score} ← **${a.after.score}** از ۱۰۰`,
    ``,
    `## ✅ اصلاحات انجام‌شده`,
    `| مورد | تعداد |`,
    `|---|---|`,
    `| متادیتای سئوی محصولات تکمیل شد | ${a.fixed.productSeo} |`,
    `| توضیحات کوتاه محصولات بازنویسی شد | ${a.fixed.productDesc} |`,
    `| متادیتای مقالات وبلاگ تکمیل شد | ${a.fixed.postSeo} |`,
    `| متادیتای صفحات ثابت تکمیل شد | ${a.fixed.pageSeo} |`,
    ``
  ];
  if (a.post) {
    lines.push(
      `## ✍️ مقاله جدید وبلاگ`,
      `- **عنوان:** ${a.post.title}`,
      `- **وضعیت:** ${a.post.status === 'published' ? 'منتشر شد ✅' : 'پیش‌نویس — منتظر تأیید مدیر 🕓'}`,
      `- **آدرس:** /blog/${a.post.slug}`,
      ``
    );
  }
  if (a.after.issues.length) {
    lines.push(`## ⚠️ موارد باقی‌مانده (نیاز به اقدام انسانی یا اجرای بعدی)`);
    for (const i of a.after.issues) {
      lines.push(`- **[${i.severity === 'high' ? 'مهم' : i.severity === 'medium' ? 'متوسط' : 'جزئی'}] ${i.title}** — ${i.detail}`);
    }
  } else {
    lines.push(`## 🎉 هیچ مشکل سئویی باقی نمانده است!`);
  }
  lines.push(``, `---`, `*این گزارش به‌صورت خودکار توسط دستیار سئو تولید شده است.*`);
  return lines.join('\n');
}

// ── Main entry ───────────────────────────────────────────────────────────────
export async function runAutopilot(mode: AutopilotMode, authorId?: string): Promise<AutopilotResult> {
  const settings = await getSettings();
  const storeName = String(settings.storeName || 'روغن‌لند');

  const before = await runSeoAudit();

  const fixed = {
    productSeo: await fixProductSeo(storeName),
    productDesc: await fixThinDescriptions(storeName),
    postSeo: await fixPostSeo(storeName),
    pageSeo: await fixPageSeo(storeName)
  };

  const { created, usedAi } = await createGeneratedPost(null, mode, authorId);
  const post = { title: created.title, slug: created.slug, status: created.status };

  const after = await runSeoAudit();
  const reportMarkdown = buildReport({ mode, usedAi, before, after, fixed, post });

  const result: AutopilotResult = {
    ok: true, mode, usedAi,
    scoreBefore: before.score, scoreAfter: after.score,
    fixed, post, reportMarkdown,
    finishedAt: new Date().toISOString()
  };
  await setSetting('seoLastReport', result, 'seo');
  return result;
}

export async function getLastReport(): Promise<AutopilotResult | null> {
  const s = await getSettings();
  const raw = s.seoLastReport;
  if (!raw || typeof raw !== 'object') return null;
  return raw as unknown as AutopilotResult;
}

export { aiAvailable };
