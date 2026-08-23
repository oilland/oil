import { loginAction } from '@/actions/auth';
import { getSettings } from '@/lib/settings';
import { Flash } from '@/components/ui';

export const metadata = { title: 'ورود مدیریت' };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const settings = await getSettings();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center justify-center rounded-2xl bg-white/95 px-4 py-2.5 shadow-2xl">
            <img src={settings.logoUrl || '/images/logo.png'} alt={settings.storeName} className="h-16 w-auto" />
          </span>
          <h1 className="text-xl font-extrabold text-white">پنل مدیریت روغن‌لند</h1>
          <p className="mt-1 text-sm text-slate-400">برای ادامه وارد شوید</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <Flash searchParams={sp} />
          <form action={loginAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">ایمیل</label>
              <input id="email" name="email" type="email" dir="ltr" required className="input" placeholder="ایمیل مدیریت" />
            </div>
            <div>
              <label className="label" htmlFor="password">رمز عبور</label>
              <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full !py-3">ورود به پنل</button>
          </form>
        </div>
      </div>
    </div>
  );
}
