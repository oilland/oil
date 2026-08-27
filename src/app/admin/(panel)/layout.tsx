import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { Sidebar } from '@/components/admin/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') redirect('/');
  const isSuper = session.role === 'SUPER_ADMIN';
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <Sidebar perms={session.perms} isSuper={isSuper} userName={session.name} logoUrl={settings.logoUrl} />
      <main className="lg:ms-0 lg:pr-64">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        <p className="pb-6 text-center text-[11px] text-slate-400">طراحی و توسعه: seytare team</p>
      </main>
    </div>
  );
}
