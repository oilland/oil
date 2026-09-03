import Link from 'next/link';
import { analyticsRange, tehranDayStr, addDaysStr } from '@/lib/analytics';
import { faNum, formatShortDate } from '@/lib/format';
import { StatCard } from '@/components/admin/StatCard';
import { LineChart, HBarChart } from '@/components/admin/Charts';
import { IconChart, IconUsers, IconEye, IconInbox } from '@/components/icons';

export const metadata = { title: 'آمار بازدید' };
export const dynamic = 'force-dynamic';

function pathLabel(p: string) {
  if (p === '/') return 'صفحه اصلی';
  if (p === '/products') return 'محصولات';
  if (p === '/blog') return 'وبلاگ';
  if (p === '/vehicle') return 'انتخاب خودرو';
  if (p.startsWith('/products/')) return 'محصول: ' + decodeURIComponent(p.slice('/products/'.length));
  if (p.startsWith('/blog/')) return 'مقاله: ' + decodeURIComponent(p.slice('/blog/'.length));
  return p;
}

function sum(rows: { views: number }[]) {
  return rows.reduce((a, r) => a + Number(r.views || 0), 0);
}

export default async function StatsPage() {
  const today = tehranDayStr();
  const d7 = addDaysStr(today, -6);
  const d30 = addDaysStr(today, -29);
  const rows = await analyticsRange(d30, today);

  const todayRows = rows.filter((r) => toDay(r.day) === today);
  const weekRows = rows.filter((r) => toDay(r.day) >= d7);
  const viewsToday = sum(todayRows.filter((r) => r.kind === 'path'));
  const uniqToday = todayRows.filter((r) => r.kind === 'uniq').length;
  const views7 = sum(weekRows.filter((r) => r.kind === 'path'));
  const uniq7 = weekRows.filter((r) => r.kind === 'uniq').length;
  const views30 = sum(rows.filter((r) => r.kind === 'path'));
  const uniq30 = rows.filter((r) => r.kind === 'uniq').length;

  const byDay = new Map<string, number>();
  for (const r of rows) {
    if (r.kind !== 'path') continue;
    const k = toDay(r.day);
    byDay.set(k, (byDay.get(k) ?? 0) + Number(r.views));
  }
  const series: number[] = [];
  const labels: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDaysStr(today, -i);
    series.push(byDay.get(d) ?? 0);
    labels.push(formatShortDate(d + 'T00:00:00.000Z'));
  }

  const pathMap = new Map<string, number>();
  for (const r of weekRows) {
    if (r.kind !== 'path') continue;
    pathMap.set(r.key, (pathMap.get(r.key) ?? 0) + Number(r.views));
  }
  const topPages = [...pathMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value]) => ({ label: pathLabel(label), value }));

  const refMap = new Map<string, number>();
  for (const r of weekRows) {
    if (r.kind !== 'ref') continue;
    refMap.set(r.key, (refMap.get(r.key) ?? 0) + Number(r.views));
  }
  const topRefs = [...refMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">آمار بازدید سایت</h1>
          <p className="mt-1 text-sm text-slate-500">بازدید واقعی فروشگاه — از همین لحظه به بعد جمع می‌شود.</p>
        </div>
        <Link href="/admin" className="btn-outline">داشبورد</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<IconEye className="h-5 w-5" />} label="بازدید امروز" value={faNum(viewsToday)} sub={`${faNum(uniqToday)} بازدیدکننده`} tone="green" />
        <StatCard icon={<IconUsers className="h-5 w-5" />} label="۷ روز" value={faNum(views7)} sub={`${faNum(uniq7)} بازدیدکننده`} tone="brand" />
        <StatCard icon={<IconChart className="h-5 w-5" />} label="۳۰ روز" value={faNum(views30)} sub={`${faNum(uniq30)} بازدیدکننده`} tone="accent" />
        <StatCard icon={<IconInbox className="h-5 w-5" />} label="تعداد صفحات در ۷ روز" value={faNum(pathMap.size)} tone="brand" />
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">نمودار بازدید ۳۰ روز</h2>
        <LineChart data={series} labels={[labels[0], labels[14], labels[29]]} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">پربازدیدترین صفحات (۷ روز)</h2>
          <HBarChart data={topPages} />
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">ورودی از سایت‌های دیگر (۷ روز)</h2>
          <HBarChart data={topRefs} />
        </div>
      </div>
    </div>
  );
}

function toDay(d: Date | string): string {
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}
