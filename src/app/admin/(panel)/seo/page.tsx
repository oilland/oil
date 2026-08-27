import { runSeoAudit } from '@/lib/seo/analyzer';
import { getLastReport } from '@/lib/seo/autopilot';
import { aiAvailable } from '@/lib/seo/ai';
import { getSettings } from '@/lib/settings';
import { runSeoAutopilotAction, generateSeoPostAction, saveSeoSettingsAction } from '@/actions/admin-seo';
import { Flash } from '@/components/ui';
import { IconSparkles, IconCheck, IconAlert, IconDownload, IconFileText, IconSettings } from '@/components/icons';

export const dynamic = 'force-dynamic';

const SEV: Record<string, { label: string; cls: string }> = {
  high: { label: 'مهم', cls: 'bg-red-100 text-red-700' },
  medium: { label: 'متوسط', cls: 'bg-amber-100 text-amber-800' },
  low: { label: 'جزئی', cls: 'bg-slate-200 text-slate-700' }
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#059669' : score >= 55 ? '#d97706' : '#dc2626';
  const r = 52, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 60 60)"
      />
      <text x="60" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>{score}</text>
    </svg>
  );
}

export default async function SeoAssistantPage({
  searchParams
}: {
  searchParams: Promise<{ flash?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const [audit, lastReport, ai, settings] = await Promise.all([
    runSeoAudit(),
    getLastReport(),
    aiAvailable(),
    getSettings()
  ]);
  const defaultMode = String(settings.seoAutoMode || 'review');

  return (
    <div className="space-y-6">
      <Flash searchParams={sp} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
            <IconSparkles className="h-6 w-6 text-brand" /> دستیار سئو
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            تحلیل خودکار سئو، رفع کمبودها، تولید مقاله وبلاگ و گزارش — برای بازدید و فروش بیشتر
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${ai ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
          {ai ? '🤖 هوش مصنوعی متصل است' : 'حالت قالب هوشمند (بدون کلید API)'}
        </span>
      </div>

      {/* ── Score + one-click autopilot ─────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center p-6 text-center">
          <ScoreRing score={audit.score} />
          <p className="mt-2 text-sm font-bold text-slate-700">امتیاز سئوی فروشگاه</p>
          <p className="text-xs text-slate-400">{audit.issues.length} مورد برای بهبود پیدا شد</p>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-base font-extrabold text-slate-900">🚀 اجرای دستیار (یک کلیک، همه کارها)</h2>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            با یک کلیک: تحلیل کامل ← تکمیل متادیتای سئوی همه محصولات/مقالات/صفحات ← بازنویسی توضیحات کوتاه ←
            تولید یک مقاله جدید وبلاگ ← ساخت گزارش قابل دانلود.
          </p>
          <form action={runSeoAutopilotAction} className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit" name="mode" value="review"
              className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold"
            >
              اجرا + بازبینی مدیر (مقاله = پیش‌نویس)
            </button>
            <button
              type="submit" name="mode" value="auto"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              اجرای تمام‌خودکار (انتشار مستقیم)
            </button>
          </form>
          <p className="mt-3 text-[11px] text-slate-400">
            حالت پیش‌فرض فعلی: <b>{defaultMode === 'auto' ? 'تمام‌خودکار' : 'بازبینی مدیر'}</b> · مقاله‌های پیش‌نویس از
            «وبلاگ» قابل ویرایش و انتشارند. اجرای زمان‌بندی‌شده نیز از طریق <code dir="ltr">/api/seo/auto</code> ممکن است.
          </p>
        </div>
      </div>

      {/* ── Issues ──────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900">
          <IconAlert className="h-5 w-5 text-amber-500" /> تحلیل لحظه‌ای — کجاها کم‌وکاستی داریم؟
        </h2>
        {audit.issues.length === 0 ? (
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-600">
            <IconCheck className="h-5 w-5" /> عالیه! هیچ مشکل سئویی پیدا نشد.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {audit.issues.map((i) => (
              <li key={i.id} className="flex flex-wrap items-start gap-3 py-3">
                <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${SEV[i.severity].cls}`}>
                  {SEV[i.severity].label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    {i.title}
                    <span className="mr-2 text-[11px] font-normal text-slate-400">({i.area})</span>
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{i.detail}</p>
                </div>
                <span className={`mt-0.5 text-[11px] font-bold ${i.fixable ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {i.fixable ? '⚡ رفع خودکار می‌شود' : '👤 اقدام دستی'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Blog generator ──────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
            <IconFileText className="h-5 w-5 text-brand" /> تولید مقاله وبلاگ
          </h2>
          <p className="mb-4 text-xs leading-6 text-slate-500">
            موضوع دلخواه بنویس یا خالی بگذار تا دستیار خودش بهترین موضوع را از صف موضوعات سئوشده انتخاب کند.
          </p>
          <form action={generateSeoPostAction} className="space-y-3">
            <input
              name="topic" className="input w-full"
              placeholder="مثلاً: بهترین روغن موتور برای پراید — راهنمای ۱۴۰۵"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <input type="radio" name="mode" value="review" defaultChecked={defaultMode !== 'auto'} /> پیش‌نویس (بازبینی مدیر)
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <input type="radio" name="mode" value="auto" defaultChecked={defaultMode === 'auto'} /> انتشار مستقیم
              </label>
            </div>
            <button className="btn-primary rounded-xl px-5 py-2 text-sm font-bold">✍️ تولید مقاله</button>
          </form>
        </div>

        {/* ── Last report ─────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
            <IconDownload className="h-5 w-5 text-brand" /> آخرین گزارش خروجی
          </h2>
          {lastReport ? (
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                اجرا: <b>{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastReport.finishedAt))}</b>
                {' · '}امتیاز <b>{lastReport.scoreBefore} ← {lastReport.scoreAfter}</b>
                {' · '}موتور: {lastReport.usedAi ? 'هوش مصنوعی' : 'قالب هوشمند'}
              </p>
              <p className="text-xs text-slate-500">
                اصلاحات: {lastReport.fixed.productSeo} سئوی محصول · {lastReport.fixed.productDesc} توضیح محصول ·{' '}
                {lastReport.fixed.postSeo} سئوی مقاله · {lastReport.fixed.pageSeo} سئوی صفحه
              </p>
              {lastReport.post && (
                <p className="text-xs text-slate-500">
                  مقاله: «{lastReport.post.title}» — {lastReport.post.status === 'published' ? 'منتشرشده ✅' : 'پیش‌نویس 🕓'}
                </p>
              )}
              <a
                href="/api/seo/report" target="_blank"
                className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <IconDownload className="h-4 w-4" /> دانلود گزارش کامل (Markdown)
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-400">هنوز اجرایی ثبت نشده — دکمه «اجرای دستیار» را بزن.</p>
          )}
        </div>
      </div>

      {/* ── AI settings ─────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
          <IconSettings className="h-5 w-5 text-brand" /> اتصال هوش مصنوعی (اختیاری)
        </h2>
        <p className="mb-4 text-xs leading-6 text-slate-500">
          بدون کلید هم دستیار با «قالب هوشمند» کار می‌کند؛ اما با اتصال یک سرویس سازگار با OpenAI (مثل{' '}
          <b>Liara AI</b>، AvalAI یا OpenAI) کیفیت مقاله‌ها حرفه‌ای‌تر می‌شود. آدرس پایه باید به <code dir="ltr">/v1</code> ختم شود.
        </p>
        <form action={saveSeoSettingsAction} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Base URL (مثلاً https://ai.liara.ir/api/v1)</label>
            <input name="aiBaseUrl" dir="ltr" className="input mt-1 w-full" defaultValue={String(settings.aiBaseUrl || '')} placeholder="https://ai.liara.ir/api/v1" />
          </div>
          <div>
            <label className="label">API Key</label>
            <input name="aiApiKey" dir="ltr" type="password" className="input mt-1 w-full" defaultValue={String(settings.aiApiKey || '')} placeholder="sk-..." />
          </div>
          <div>
            <label className="label">مدل</label>
            <input name="aiModel" dir="ltr" className="input mt-1 w-full" defaultValue={String(settings.aiModel || 'openai/gpt-4o-mini')} />
          </div>
          <div>
            <label className="label">حالت پیش‌فرض اجرا</label>
            <select name="seoAutoMode" className="input mt-1 w-full" defaultValue={defaultMode}>
              <option value="review">بازبینی مدیر (پیش‌نویس)</option>
              <option value="auto">تمام‌خودکار (انتشار مستقیم)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary rounded-xl px-5 py-2 text-sm font-bold">ذخیره تنظیمات</button>
          </div>
        </form>
      </div>
    </div>
  );
}
