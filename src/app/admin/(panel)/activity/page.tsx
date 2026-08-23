import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'گزارش فعالیت' };

export default async function ActivityPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">گزارش فعالیت مدیران</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-right text-xs text-slate-500">
              <th className="p-3 font-medium">مدیر</th>
              <th className="p-3 font-medium">اقدام</th>
              <th className="p-3 font-medium">موجودیت</th>
              <th className="p-3 font-medium">مقدار قبلی</th>
              <th className="p-3 font-medium">مقدار جدید</th>
              <th className="p-3 font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-medium text-slate-800">{l.adminName ?? (l.userId ? 'کاربر' : 'سیستم')}</td>
                <td className="p-3 text-slate-700">{l.action}</td>
                <td className="p-3 text-xs text-slate-500" dir="ltr">{l.entity}{l.entityId ? ` · ${l.entityId.slice(0, 10)}` : ''}</td>
                <td className="p-3 text-xs text-slate-500">{l.oldValue ?? '—'}</td>
                <td className="p-3 text-xs text-slate-500">{l.newValue ?? '—'}</td>
                <td className="p-3 text-xs text-slate-500">{formatDateTime(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="p-8 text-center text-sm text-slate-400">فعالیتی ثبت نشده است.</p>}
      </div>
    </div>
  );
}
